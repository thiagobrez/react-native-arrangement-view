#!/bin/zsh
# Usage: run.sh <package> <scenario: fold|fold-load|remount|unfold> <out.log> [cycles]
# Starts the app fresh in book posture, runs the scenario, and saves the
# RAVBENCH and ReactNativeJS logcat lines with monotonic timestamps.
set -e
PKG=$1 SCENARIO=$2 OUT=$3 CYCLES=${4:-10}
source ${0:A:h}/lib.sh

$ADB emu posture 3 >/dev/null
sleep 2
for p in arrangementview.example arrangementview.example.base arrangementview.example.native arrangementview.example.nativec arrangementview.example.main; do
  $ADB shell am force-stop $p
done
$ADB logcat -c
$ADB shell am start -n $PKG/arrangementview.example.MainActivity >/dev/null
sleep 5

case $SCENARIO in
  fold|fold-load)
    if [[ $SCENARIO == fold-load ]]; then
      tap_text "JS idle"
      sleep 1
    fi
    for i in $(seq $CYCLES); do
      $ADB emu posture 2 >/dev/null; sleep 1.5
      $ADB emu posture 3 >/dev/null; sleep 1.5
    done
    ;;
  remount)
    tap_text "Remount"
    sleep $((CYCLES * 1.5 + 3))
    ;;
  unfold)
    for i in $(seq $CYCLES); do
      $ADB emu posture 1 >/dev/null; sleep 3
      $ADB emu posture 3 >/dev/null; sleep 3
    done
    ;;
esac

$ADB logcat -d -v monotonic -s RAVBENCH:I ReactNativeJS:I > $OUT
$ADB shell am force-stop $PKG
echo "$PKG $SCENARIO -> $OUT ($(grep -c RAVBENCH $OUT) lines)"
