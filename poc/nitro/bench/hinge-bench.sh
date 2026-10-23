#!/bin/zsh
# Usage: hinge-bench.sh <package> <mode fabric|nitro|none> <render 0|1> <load 0|200> <out.json>
# Half-opens the emulator, starts the bench app fresh, subscribes one transport, sweeps the hinge
# at 60 Hz for ~12 s and writes the app's HINGEBENCH report plus JS/main thread CPU to <out.json>.
set -e
PKG=$1 MODE=$2 RENDER=$3 LOAD=$4 OUT=${5:A}
ADB=$HOME/Library/Android/sdk/platform-tools/adb
export ANDROID_SERIAL=${ANDROID_SERIAL:-emulator-5554}
PORT=${ANDROID_SERIAL#emulator-}

tap_text() {
  local bounds=""
  for attempt in 1 2 3 4 5 6 7 8; do
    $ADB shell rm -f /sdcard/ui.xml
    $ADB shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
    bounds=$($ADB shell cat /sdcard/ui.xml 2>/dev/null | tr '>' '\n' | grep -E "text=\"$1" | head -1 | grep -o 'bounds="[^"]*"' || true)
    [[ -n $bounds ]] && break
    sleep 1
  done
  [[ -n $bounds ]] || { echo "no view with text $1" >&2; return 1; }
  local nums=($(echo $bounds | grep -o '[0-9]\+'))
  $ADB shell input tap $(( (nums[1] + nums[3]) / 2 )) $(( (nums[2] + nums[4]) / 2 ))
}

cpu_ms() { # <pid> <tid> -> on-CPU ms from schedstat
  $ADB shell cat /proc/$1/task/$2/schedstat | awk '{ printf "%.3f", $1 / 1e6 }'
}

$ADB emu sensor set hinge-angle0 100 >/dev/null
sleep 1
for p in arrangementview.example arrangementview.example.hinge; do $ADB shell am force-stop $p; done
$ADB logcat -c
$ADB shell am start -n $PKG/arrangementview.example.MainActivity >/dev/null
sleep 3

tap_text "Mode $MODE"
[[ $RENDER == 1 ]] && tap_text "Render"
[[ $LOAD == 200 ]] && tap_text "Load"
sleep 2
tap_text "Report"
sleep 1

PID=$($ADB shell pidof $PKG | tr -d '\r')
JS_TID=$($ADB shell "for t in /proc/$PID/task/*; do [ \"\$(cat \$t/comm)\" = mqt_v_js ] && basename \$t; done" | tr -d '\r' | head -1)
[[ -n $JS_TID ]] || { echo "no mqt_v_js thread in $PID" >&2; exit 1; }
JS0=$(cpu_ms $PID $JS_TID) MAIN0=$(cpu_ms $PID $PID)
SWEEP=$(python3 ${0:A:h}/hinge_sweep.py 70 130 70 130 70 130 70 130 70 130 70 130 70 --hz 60 --step 1 --port $PORT)
JS1=$(cpu_ms $PID $JS_TID) MAIN1=$(cpu_ms $PID $PID)
sleep 1.5
tap_text "Report"
sleep 1.5
LINE=$($ADB logcat -d -s ReactNativeJS:I | grep HINGEBENCH | tail -1)
E2E=$($ADB logcat -d -s RAVE2E:I | grep -o '{.*}' | tail -1)
LOADAVG=$(uptime | sed -E 's/.*load averages?: //')

python3 - "$LINE" "$SWEEP" "$JS0" "$JS1" "$MAIN0" "$MAIN1" "$LOADAVG" "$PKG" "$OUT" "${E2E:-null}" <<'PY'
import json, re, sys
line, sweep, js0, js1, main0, main1, loadavg, pkg, out, e2e = sys.argv[1:]
report = json.loads(re.search(r'HINGEBENCH (\{.*\})', line).group(1))
sent = re.search(r'sent=(\d+) elapsed=([\d.]+)s', sweep)
report.update(
    package=pkg,
    sent=int(sent.group(1)),
    sweepS=float(sent.group(2)),
    jsCpuMs=round(float(js1) - float(js0), 3),
    mainCpuMs=round(float(main1) - float(main0), 3),
    hostLoad=loadavg.strip(),
    e2e=json.loads(e2e),
)
json.dump(report, open(out, 'w'))
print(json.dumps(report))
PY
$ADB shell am force-stop $PKG
