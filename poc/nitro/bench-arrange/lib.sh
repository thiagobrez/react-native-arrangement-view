# Shared by run.sh and rtl.sh. Taps the first view whose text starts with $1.
ADB=$HOME/Library/Android/sdk/platform-tools/adb
tap_text() {
  local bounds=""
  for attempt in 1 2; do
    $ADB shell rm -f /sdcard/ui.xml
    $ADB shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 || true
    bounds=$($ADB shell cat /sdcard/ui.xml 2>/dev/null | tr '>' '\n' | grep -E "text=\"$1" | head -1 | grep -o 'bounds="[^"]*"' || true)
    [[ -n $bounds ]] && break
    sleep 1
  done
  if [[ -z $bounds ]]; then
    # The bench screen's JS clock keeps uiautomator from ever idling. Book-posture bounds from an
    # agent-device snapshot of the Bench screen, window 2076x2152.
    case $1 in
      "JS idle") bounds='bounds="[855,1972][1049,2074]"' ;;
      "Remount") bounds='bounds="[1088,1972][1399,2074]"' ;;
      *) echo "no view with text $1" >&2; return 1 ;;
    esac
  fi
  local nums=($(echo $bounds | grep -o '[0-9]\+'))
  $ADB shell input tap $(( (nums[1] + nums[3]) / 2 )) $(( (nums[2] + nums[4]) / 2 ))
}
