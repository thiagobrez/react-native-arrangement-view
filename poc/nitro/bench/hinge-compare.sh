#!/bin/zsh
# Usage: hinge-compare.sh <rounds> <out dir>
# Runs every (mode, render, load) case once per round. Within each (render, load) group the
# order of the transports rotates every round, so warm-up and drift favour none of them. Each
# run waits for the host's 1-minute load to drop under 8 and records it.
set -e
HERE=${0:A:h}
ROUNDS=$1 OUT=${2:A}
PKG=arrangementview.example.hinge
mkdir -p $OUT
GROUPS_=("0 0:fabric nitro turbo none" "1 0:fabric nitro turbo" "1 200:fabric nitro turbo")
for round in $(seq $ROUNDS); do
  for group in $GROUPS_; do
    settings=(${=group%%:*}) modes=(${=group#*:})
    shift=$(( (round - 1) % $#modes ))
    order=(${modes[$((shift + 1)),-1]} ${modes[1,$shift]})
    for mode in $order; do
      until (( $(sysctl -n vm.loadavg | awk '{print int($2)}') < 8 )); do sleep 10; done
      zsh $HERE/hinge-bench.sh $PKG $mode $settings[1] $settings[2] \
        $OUT/$mode-r$settings[1]-l$settings[2]-$round.json >/dev/null
      echo "round $round $mode render=$settings[1] load=$settings[2] host=$(sysctl -n vm.loadavg | awk '{print $2}')"
    done
  done
done
python3 -I $HERE/hinge-report.py $OUT/*.json
