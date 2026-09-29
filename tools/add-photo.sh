#!/bin/bash
# Prepares one photo for the Photography section of the site.
#   1. Writes two web copies with ALL metadata removed (GPS position, camera serial number...):
#        assets/img/photos/thumb/<name>.jpg  (1000 px, used in the grid)
#        assets/img/photos/full/<name>.jpg   (2000 px, used in the full screen viewer)
#   2. Prints the HTML block to paste into the gallery in index.html.
#      The shooting settings (lens, focal length, aperture, speed, ISO, date) are read from the original.
#
# Usage:   tools/add-photo.sh <original> "<short description>" [name]
# Example: tools/add-photo.sh Photos/DSCF1234.jpg "Mountain lake at sunrise"
# Options: TRIM=1 tools/add-photo.sh ...   removes a plain white frame (images exported from Canva)
# Needs:   brew install imagemagick exiftool
set -euo pipefail

src="$1"
alt="$2"
name="${3:-$(basename "${src%.*}" | tr '[:upper:] ' '[:lower:]-')}"
root="$(cd "$(dirname "$0")/.." && pwd)"
thumb="assets/img/photos/thumb/$name.jpg"
full="assets/img/photos/full/$name.jpg"
mkdir -p "$root/$(dirname "$thumb")" "$root/$(dirname "$full")"

prep=(-auto-orient)
if [ "${TRIM:-0}" = "1" ]; then prep+=(-fuzz 6% -trim +repage -shave 3x3 +repage); fi

magick "$src" "${prep[@]}" -resize '2000x2000>' -strip -interlace JPEG -quality 82 "$root/$full"
magick "$src" "${prep[@]}" -resize '1000x1000>' -strip -interlace JPEG -quality 78 "$root/$thumb"

w=$(magick identify -format '%w' "$root/$thumb")
h=$(magick identify -format '%h' "$root/$thumb")
ar=$(awk -v w="$w" -v h="$h" 'BEGIN { printf "%.3f", w / h }')

# Shooting settings, formatted like "XF 18-55mm", "34 mm", "f/8", "1/60 s", "ISO 250", "June 2025"
tag() { exiftool -s3 "-$1" "$src" 2>/dev/null | head -1; }
lens=$(tag LensModel | sed -E 's/^XF([0-9]+-[0-9]+)mm.*/XF \1mm/; s/^([0-9]+)\.0-([0-9]+)\.0 mm.*/\1-\2mm/')
focal=$(tag FocalLength | awk '{ if ($1 != "") printf "%.0f mm", $1 }')
fnum=$(tag FNumber | sed -E 's/\.0$//; s/^(.+)$/f\/\1/')
speed=$(tag ExposureTime | sed -E 's/^(.+)$/\1 s/')
iso=$(tag ISO | sed -E 's/^(.+)$/ISO \1/')
taken=$(tag DateTimeOriginal)
when=""
if [ -n "$taken" ]; then when=$(LC_ALL=en_US.UTF-8 date -j -f "%Y:%m:%d %H:%M:%S" "$taken" "+%B %Y" 2>/dev/null || true); fi

esc() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/"/\&quot;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g'; }

meta=""
[ -n "$lens" ] && meta+="<span class=\"lens\">$(esc "$lens")</span>"
for v in "$focal" "$fnum" "$speed" "$iso"; do [ -n "$v" ] && meta+="<span>$(esc "$v")</span>"; done
[ -n "$when" ] && meta+="<span class=\"date\">$when</span>"

echo "          <a class=\"photo\" href=\"$full\" style=\"--ar: $ar\">"
echo "            <img src=\"$thumb\" alt=\"$(esc "$alt")\" width=\"$w\" height=\"$h\" loading=\"lazy\" decoding=\"async\">"
[ -n "$meta" ] && echo "            <span class=\"photo-meta\">$meta</span>"
echo "          </a>"
