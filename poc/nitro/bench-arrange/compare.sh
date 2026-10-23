#!/bin/zsh
# Usage: compare.sh <rounds> [scenario ...]
# Logs: runs/final-<side>-<scenario>-<round>.log
set -e
HERE=${0:A:h}
ROUNDS=$1; shift
SCENARIOS=($@)
(( $#SCENARIOS )) || SCENARIOS=(fold fold-load remount unfold)
typeset -A PKG=(base arrangementview.example.base native arrangementview.example.native nativec arrangementview.example.nativec)
SIDES=(${=SIDES:-base native})
PREFIX=${PREFIX:-final}
typeset -A CYCLES=(fold 10 fold-load 10 remount 10 unfold 5)
for round in $(seq $ROUNDS); do
  order=($SIDES)
  (( round % 2 == 0 )) && order=(${(Oa)SIDES})
  for scenario in $SCENARIOS; do
    end=$((SECONDS + 1800))
    until (( $(sysctl -n vm.loadavg | awk '{print int($2)}') < 20 )) || (( SECONDS >= end )); do sleep 10; done
    for side in $order; do
      echo "$side $scenario $round load=$(sysctl -n vm.loadavg | awk '{print $2}')" >> $HERE/runs/$PREFIX-load.txt
      $HERE/run.sh ${PKG[$side]} $scenario $HERE/runs/$PREFIX-$side-$scenario-$round.log ${CYCLES[$scenario]} 2>/dev/null
    done
  done
done
python3 $HERE/report.py $HERE/runs/$PREFIX-*.log
