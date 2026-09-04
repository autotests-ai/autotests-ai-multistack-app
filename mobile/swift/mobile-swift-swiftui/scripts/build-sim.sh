#!/usr/bin/env bash
# Simulator .app — the Appium artifact for this cell.
#
#   scripts/build-sim.sh                       # default API base (live pair)
#   MULTISTACK_API_BASE=http://127.0.0.1:8080/api scripts/build-sim.sh
#
# Needs full Xcode: Command Line Tools alone carry no iOS SDK.
set -euo pipefail

cd "$(dirname "$0")/.."

developer_dir="$(xcode-select -p 2>/dev/null || true)"
case "$developer_dir" in
  *CommandLineTools*|"")
    echo "STOP: full Xcode required (current: ${developer_dir:-none})." >&2
    echo "      xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
    exit 1
    ;;
esac

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

app="build/Build/Products/Debug-iphonesimulator/Multistack.app"
echo
echo "app: $(cd "$(dirname "$app")" && pwd)/$(basename "$app")"
echo "run: xcrun simctl install booted \"$app\" && xcrun simctl launch booted dev.multistack.swiftui"
