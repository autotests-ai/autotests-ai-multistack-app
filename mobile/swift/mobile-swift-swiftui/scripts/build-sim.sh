#!/usr/bin/env bash
# Simulator .app — the Appium artifact for this cell.
#
#   scripts/build-sim.sh                       # default API base (live pair)
#   MULTISTACK_API_BASE=http://127.0.0.1:8080/api scripts/build-sim.sh
#
# Needs full Xcode: Command Line Tools alone carry no iOS SDK.
# First run on a machine: a human must accept the license
# (`sudo xcodebuild -license`). This script will not hang on sudo.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${DEVELOPER_DIR:-}" ]; then
  developer_dir="$(xcode-select -p 2>/dev/null || true)"
  case "$developer_dir" in
    *CommandLineTools*|"")
      if [ -d /Applications/Xcode.app/Contents/Developer ]; then
        export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
      else
        echo "STOP: full Xcode required (current: ${developer_dir:-none})." >&2
        echo "      install Xcode, then: xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
        exit 1
      fi
      ;;
  esac
fi

if ! xcodebuild -license check >/dev/null 2>&1; then
  echo "STOP: Xcode license not accepted (needs a human, not this script)." >&2
  echo "      sudo xcodebuild -license" >&2
  exit 69
fi

args=(
  -project Multistack.xcodeproj
  -scheme Multistack
  -configuration Debug
  -sdk iphonesimulator
  -destination "generic/platform=iOS Simulator"
  -derivedDataPath build
  CODE_SIGNING_ALLOWED=NO
)
if [ -n "${MULTISTACK_API_BASE:-}" ]; then
  args+=("MULTISTACK_API_BASE=${MULTISTACK_API_BASE}")
fi
if [ -n "${MULTISTACK_BACKEND_ID:-}" ]; then
  args+=("MULTISTACK_BACKEND_ID=${MULTISTACK_BACKEND_ID}")
fi

xcodebuild "${args[@]}" build

app="build/Build/Products/Debug-iphonesimulator/multistack-app.app"
if [ ! -d "$app" ]; then
  echo "STOP: expected $app after xcodebuild." >&2
  exit 1
fi

zip="${app}.zip"
rm -f "$zip"
ditto -c -k --keepParent "$app" "$zip"

echo
echo "app: $(cd "$(dirname "$app")" && pwd)/$(basename "$app")"
echo "zip: $(cd "$(dirname "$zip")" && pwd)/$(basename "$zip")"
echo "     GitHub: gh release upload ios $(basename "$zip") --clobber"
echo "     (tag ios, not android-debug; .app is a directory so the asset is the zip)"
echo "run: xcrun simctl install booted \"$app\" && xcrun simctl launch booted dev.multistack.swiftui"
