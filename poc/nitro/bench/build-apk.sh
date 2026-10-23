#!/bin/zsh
# Usage: build-apk.sh <applicationId> <out.apk> [bench]
# Release build of the example from this checkout (or $RAV_ROOT). "bench" bundles with
# EXPO_PUBLIC_RAV_BENCH=1 so the app opens on the hinge bench. The JS bundle task always reruns:
# Gradle does not track the library's src/.
set -e
APP_ID=$1 OUT=${2:A} MODE=${3:-}
ROOT=${RAV_ROOT:-${0:A:h}/../../..}
export ANDROID_HOME=${ANDROID_HOME:-$HOME/Library/Android/sdk}
cd $ROOT/apps/example-expo/android
sed -i '' -E "s/applicationId '[^']+'/applicationId '$APP_ID'/" app/build.gradle
grep -q "applicationId '$APP_ID'" app/build.gradle
trap "sed -i '' -E \"s/applicationId '[^']+'/applicationId 'arrangementview.example'/\" app/build.gradle" EXIT
if [[ $MODE == bench ]]; then export EXPO_PUBLIC_RAV_BENCH=1; else unset EXPO_PUBLIC_RAV_BENCH; fi
./gradlew :app:createBundleReleaseJsAndAssets --rerun -PreactNativeArchitectures=arm64-v8a -q
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a -q
cp app/build/outputs/apk/release/app-release.apk $OUT
echo "built $APP_ID ${MODE:-plain} -> $OUT"
