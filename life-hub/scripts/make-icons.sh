#!/usr/bin/env bash
# Rasterizes public/favicon.svg into the PNG icons the manifest and iOS need.
# Requires a Chromium binary (CHROMIUM=/path/to/chromium) and ImageMagick.
set -euo pipefail
cd "$(dirname "$0")/.."
CHROMIUM="${CHROMIUM:-chromium}"
TMP="$(mktemp -d)"
# Full-bleed square version (iOS and maskable icons round the corners themselves).
sed 's/rx="120"/rx="0"/' public/favicon.svg > "$TMP/square.svg"
# Maskable: shrink the artwork into the 80% safe zone on the same background.
sed -e 's/rx="120"/rx="0"/' -e 's|<path d="M236|<g transform="translate(51 51) scale(0.8)"><path d="M236|' \
    -e 's|opacity="0.85"/>|opacity="0.85"/></g>|' public/favicon.svg > "$TMP/maskable.svg"
render() { # svg out size
  printf '<html><body style="margin:0;background:transparent"><img src="file://%s" width="512" height="512" style="display:block"></body></html>' "$1" > "$TMP/page.html"
  "$CHROMIUM" --headless --no-sandbox --disable-gpu --hide-scrollbars --default-background-color=00000000 \
    --allow-file-access-from-files --window-size=640,800 --screenshot="$TMP/raw.png" "file://$TMP/page.html" >/dev/null 2>&1
  convert "$TMP/raw.png" -crop 512x512+0+0 +repage "$TMP/raw.png"
  convert "$TMP/raw.png" -resize "$3x$3" "$2"
}
render "$PWD/public/favicon.svg" public/icon-512.png 512
render "$PWD/public/favicon.svg" public/icon-192.png 192
render "$TMP/maskable.svg" public/icon-maskable-512.png 512
render "$TMP/square.svg" public/apple-touch-icon.png 180
rm -rf "$TMP"
echo "Icons written to public/"
