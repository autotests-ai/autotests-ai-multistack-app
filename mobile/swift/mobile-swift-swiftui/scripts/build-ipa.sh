#!/usr/bin/env bash
# Device .ipa.
#
#   scripts/build-ipa.sh                 # unsigned payload (resign before install)
#   TEAM_ID=ABCDE12345 scripts/build-ipa.sh signed
#
# Unsigned output installs only on a device that accepts it (resign with your
# own profile, or run the `signed` mode with a real team). Simulator testing
# does not need any of this — use scripts/build-sim.sh.
set -euo pipefail

cd "$(dirname "$0")/.."
mode="${1:-unsigned}"

developer_dir="$(xcode-select -p 2>/dev/null || true)"
case "$developer_dir" in
  *CommandLineTools*|"")
    echo "STOP: full Xcode required (current: ${developer_dir:-none})." >&2
    exit 1
    ;;
esac

rm -rf build/ipa
mkdir -p build/ipa

if [ "$mode" = "signed" ]; then
  : "${TEAM_ID:?set TEAM_ID for a signed archive}"
  xcodebuild -project Multistack.xcodeproj -scheme Multistack \
    -configuration Release -sdk iphoneos -derivedDataPath build \
    -archivePath build/ipa/Multistack.xcarchive \
    DEVELOPMENT_TEAM="$TEAM_ID" -allowProvisioningUpdates archive
  xcodebuild -exportArchive -archivePath build/ipa/Multistack.xcarchive \
    -exportPath build/ipa -exportOptionsPlist scripts/export-options.plist \
    -allowProvisioningUpdates
  echo "ipa: $(pwd)/build/ipa/Multistack.ipa"
  exit 0
fi

xcodebuild -project Multistack.xcodeproj -scheme Multistack \
  -configuration Release -sdk iphoneos -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" build

app="build/Build/Products/Release-iphoneos/Multistack.app"
mkdir -p build/ipa/Payload
cp -R "$app" build/ipa/Payload/
(cd build/ipa && zip -qry Multistack-unsigned.ipa Payload)
rm -rf build/ipa/Payload
echo "ipa: $(pwd)/build/ipa/Multistack-unsigned.ipa (unsigned — resign to install)"
