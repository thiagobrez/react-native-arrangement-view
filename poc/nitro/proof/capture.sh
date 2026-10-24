#!/bin/zsh
# Usage: capture.sh <out dir> [step ...]
# Proof captures with agent-device on emulator-5554. Steps: shots fold block hinge children.
# Needs poc-plain (arrangementview.example), poc-probe (arrangementview.example.native) and
# poc-bench (arrangementview.example.hinge) installed.
set -e
OUT=${1:A}; shift
STEPS=(${@:-shots fold block hinge children})
mkdir -p $OUT
export AGENT_DEVICE_STATE_DIR=$HOME/.agent-device-rav-nitro ANDROID_HOME=$HOME/Library/Android/sdk
ADB=$ANDROID_HOME/platform-tools/adb
ad() { npx -y agent-device@0.21.31 "$@" }
open_app() {
  for p in arrangementview.example arrangementview.example.native arrangementview.example.hinge; do
    $ADB shell am force-stop $p
  done
  ad open $1 --platform android --serial emulator-5554 --foreground >/dev/null
  $ADB shell settings put system accelerometer_rotation 1
}
shot() { ad screenshot $OUT/$1.png >/dev/null; echo "shot $1"; }
layouts() { ad snapshot --json | python3 -c 'import json,sys,re; t=sys.stdin.read(); print(sorted(set(re.findall(r"(Side by side|Stacked)[^\"]*", t))))'; }

for step in $STEPS; do
  case $step in
    shots)
      open_app arrangementview.example
      ad fold open >/dev/null
      ad press 'label="Features demo"' --settle >/dev/null
      shot 1-flat-split; layouts
      ad fold half-open >/dev/null; sleep 1.5
      shot 2-book-split; layouts
      ad press 'label="Overlay"' --settle >/dev/null
      shot 3-book-overlay; layouts
      ad press 'label="Split"' --settle >/dev/null
      for i in 1 2 3; do
        $ADB emu rotate >/dev/null; sleep 2
        layouts | grep -q Stacked && break
      done
      shot 4-tabletop-split; layouts
      for i in 1 2 3 4; do
        [[ $($ADB shell dumpsys window displays | grep -m1 -o 'mCurrentRotation=[A-Z_0-9]*') == mCurrentRotation=ROTATION_0 ]] && break
        $ADB emu rotate >/dev/null; sleep 2
      done
      ad fold closed >/dev/null; sleep 1.5
      shot 5-cover-split; layouts
      ad fold open >/dev/null
      ad close >/dev/null
      ;;
    fold)
      open_app arrangementview.example
      ad fold open >/dev/null
      ad press 'label="Features demo"' --settle >/dev/null
      ad record start $OUT/fold-features-demo.mp4 --scope app --quality high --hide-touches >/dev/null
      sleep 2
      for pose in half-open open closed open half-open open; do
        ad fold $pose >/dev/null; sleep 2.5
      done
      ad record stop >/dev/null
      ad close >/dev/null
      echo "recorded fold-features-demo"
      ;;
    block)
      $ADB emu posture 3 >/dev/null
      open_app arrangementview.example.native
      sleep 3
      ad record start $OUT/fold-while-js-blocked.mp4 --scope app --quality high --hide-touches >/dev/null
      sleep 2
      for posture in 2 3; do
        ad press 'label="Block JS 3 s"' >/dev/null
        sleep 0.5
        $ADB emu posture $posture >/dev/null
        sleep 5
      done
      ad record stop >/dev/null
      ad close >/dev/null
      echo "recorded fold-while-js-blocked"
      ;;
    hinge)
      $ADB emu sensor set hinge-angle0 100 >/dev/null
      open_app arrangementview.example.hinge
      ad press 'label="Render off"' >/dev/null
      ad record start $OUT/hinge-transports.mp4 --scope app --quality high --hide-touches >/dev/null
      sleep 1
      for mode in fabric nitro turbo; do
        ad press "label=\"Mode $mode\"" >/dev/null
        sleep 1
        python3 ${0:A:h}/../bench/hinge_sweep.py 70 130 70 --hz 60 --step 1 >/dev/null
        ad press 'label="Report"' >/dev/null
        sleep 1.5
      done
      ad record stop >/dev/null
      ad close >/dev/null
      echo "recorded hinge-transports"
      ;;
    children)
      open_app arrangementview.example.hinge
      $ADB logcat -c
      ad record start $OUT/nitro-view-children.mp4 --scope device --quality high --hide-touches >/dev/null
      sleep 1
      ad press 'label="Nitro view alone"' --settle >/dev/null
      sleep 1.5
      shot nitro-view-alone
      ad back --settle >/dev/null
      sleep 1
      ad press 'label="Nitro view with children"' >/dev/null || true
      sleep 3
      ad record stop >/dev/null || true
      $ADB logcat -d | grep -E "IViewGroupManager|FATAL EXCEPTION|Process: arrangementview" > $OUT/nitro-view-children-logcat.txt || true
      ad close >/dev/null || true
      echo "recorded nitro-view-children"
      ;;
  esac
done
