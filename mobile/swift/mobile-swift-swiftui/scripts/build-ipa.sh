#!/usr/bin/env bash
# Device .ipa.
#
#   scripts/build-ipa.sh                 # unsigned payload (resign before install)
#   MULTISTACK_ENV=ci scripts/build-ipa.sh
#   TEAM_ID=ABCDE12345 scripts/build-ipa.sh signed
#
# Unsigned output installs only on a device that accepts it (resign with your
# own profile, or run the `signed` mode with a real team). Simulator testing
# does not need any of this — use scripts/build-sim.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=multistack-env.sh
. "$SCRIPT_DIR/multistack-env.sh"
cd "$SCRIPT_DIR/.."
mode="${1:-unsigned}"

if [ -z "${DEVELOPER_DIR:-}" ]; then
  developer_dir="$(xcode-select -p 2>/dev/null || true)"
  case "$developer_dir" in
    *CommandLineTools*|"")
      if [ -d /Applications/Xcode.app/Contents/Developer ]; then
        export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
      else
        echo "STOP: full Xcode required (current: ${developer_dir:-none})." >&2
        exit 1
      fi
      ;;
  esac
fi

if ! xcodebuild -license check >/dev/null 2>&1; then
  echo "STOP: Xcode license not accepted (needs a human): sudo xcodebuild -license" >&2
  exit 69
fi

rm -rf build/ipa
mkdir -p build/ipa

xcode_settings=()
if [ -n "${MULTISTACK_API_BASE:-}" ]; then
  xcode_settings+=("MULTISTACK_API_BASE=${MULTISTACK_API_BASE}")
fi
if [ -n "${MULTISTACK_BACKEND_ID:-}" ]; then
  xcode_settings+=("MULTISTACK_BACKEND_ID=${MULTISTACK_BACKEND_ID}")
fi

if [ "$mode" = "signed" ]; then
  : "${TEAM_ID:?set TEAM_ID for a signed archive}"
  signed_args=(
    -project Multistack.xcodeproj -scheme Multistack
    -configuration Release -sdk iphoneos -derivedDataPath build
    -archivePath build/ipa/Multistack.xcarchive
    DEVELOPMENT_TEAM="$TEAM_ID" -allowProvisioningUpdates
  )
  if [ ${#xcode_settings[@]} -gt 0 ]; then
    signed_args+=("${xcode_settings[@]}")
  fi
  xcodebuild "${signed_args[@]}" archive
  xcodebuild -exportArchive -archivePath build/ipa/Multistack.xcarchive \
    -exportPath build/ipa -exportOptionsPlist scripts/export-options.plist \
    -allowProvisioningUpdates
  echo "ipa: $(pwd)/build/ipa/Multistack.ipa"
  exit 0
fi

unsigned_args=(
  -project Multistack.xcodeproj -scheme Multistack
  -configuration Release -sdk iphoneos -derivedDataPath build
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY=""
)
if [ ${#xcode_settings[@]} -gt 0 ]; then
  unsigned_args+=("${xcode_settings[@]}")
fi
xcodebuild "${unsigned_args[@]}" build

app="build/Build/Products/Release-iphoneos/multistack-app.app"
mkdir -p build/ipa/Payload
cp -R "$app" build/ipa/Payload/
(cd build/ipa && zip -qry Multistack-unsigned.ipa Payload)
rm -rf build/ipa/Payload
echo "ipa: $(pwd)/build/ipa/Multistack-unsigned.ipa (unsigned — resign to install)"
