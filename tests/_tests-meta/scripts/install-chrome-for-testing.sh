#!/usr/bin/env bash
# Pinned Chrome for Testing + chromedriver (canon 148.0.7778.178).
# Layout matches helpers.LocalChromePin — no Node, no @puppeteer/browsers.
set -euo pipefail

VERSION="${CHROME_FOR_TESTING_VERSION:-148.0.7778.178}"
CFT_PATH="${CHROME_FOR_TESTING_PATH:-${HOME}/.local/share/chrome-for-testing}"

case "$(uname -s)-$(uname -m)" in
  Linux-x86_64|Linux-amd64)
    PLATFORM=linux
    CFT_ARCH=linux64
    CHROME_ZIP=chrome-linux64
    DRIVER_ZIP=chromedriver-linux64
    CHROME_BIN="${CFT_PATH}/chrome/linux-${VERSION}/chrome-linux64/chrome"
    DRIVER_BIN="${CFT_PATH}/chromedriver/linux-${VERSION}/chromedriver-linux64/chromedriver"
    ;;
  Linux-aarch64|Linux-arm64)
    PLATFORM=linux
    CFT_ARCH=linux64
    CHROME_ZIP=chrome-linux64
    DRIVER_ZIP=chromedriver-linux64
    CHROME_BIN="${CFT_PATH}/chrome/linux-${VERSION}/chrome-linux64/chrome"
    DRIVER_BIN="${CFT_PATH}/chromedriver/linux-${VERSION}/chromedriver-linux64/chromedriver"
    ;;
  Darwin-arm64)
    PLATFORM=mac_arm
    CFT_ARCH=mac-arm64
    CHROME_ZIP=chrome-mac-arm64
    DRIVER_ZIP=chromedriver-mac-arm64
    CHROME_BIN="${CFT_PATH}/chrome/mac_arm-${VERSION}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
    DRIVER_BIN="${CFT_PATH}/chromedriver/mac_arm-${VERSION}/chromedriver-mac-arm64/chromedriver"
    ;;
  Darwin-x86_64)
    PLATFORM=mac
    CFT_ARCH=mac-x64
    CHROME_ZIP=chrome-mac-x64
    DRIVER_ZIP=chromedriver-mac-x64
    CHROME_BIN="${CFT_PATH}/chrome/mac-${VERSION}/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
    DRIVER_BIN="${CFT_PATH}/chromedriver/mac-${VERSION}/chromedriver-mac-x64/chromedriver"
    ;;
  *)
    echo "Unsupported OS/arch: $(uname -s)-$(uname -m)" >&2
    exit 1
    ;;
esac

BASE_URL="https://storage.googleapis.com/chrome-for-testing-public/${VERSION}/${CFT_ARCH}"

install_archive() {
  local kind="$1"
  local zip_name="$2"
  local dest="${CFT_PATH}/${kind}/${PLATFORM}-${VERSION}"
  local url="${BASE_URL}/${zip_name}.zip"
  local tmp
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' RETURN
  curl -fsSL "$url" -o "${tmp}/${zip_name}.zip"
  rm -rf "$dest"
  mkdir -p "$dest"
  unzip -q "${tmp}/${zip_name}.zip" -d "$dest"
}

install_archive chrome "$CHROME_ZIP"
install_archive chromedriver "$DRIVER_ZIP"

chmod +x "$CHROME_BIN" "$DRIVER_BIN"
echo "Chrome for Testing ${VERSION} → ${CFT_PATH} (${PLATFORM})"
