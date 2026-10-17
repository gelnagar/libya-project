#!/usr/bin/env bash
# Downloads each historical map in archive/maps/overlays.json and cuts it into web map tiles
# under public/maps/<id>/{z}/{x}/{y}.png. Needs gdal-bin, jq, imagemagick-free tools only.
# If a scan has no georeferencing, it makes previews in archive/maps/preview/ so control points
# can be read off the map; add them to overlays.json as "gcps": [[pixelX, pixelY, lon, lat], ...].
set -euo pipefail
mkdir -p work public/maps archive/maps/preview
jq -c '.[]' archive/maps/overlays.json | while read -r m; do
  id=$(jq -r .id <<<"$m"); url=$(jq -r .url <<<"$m"); zooms=$(jq -r .zooms <<<"$m")
  ngcp=$(jq '.gcps // [] | length' <<<"$m")
  [ -f "public/maps/$id/done" ] && { echo "$id already tiled"; continue; }
  echo "== $id"
  [ -f "work/$id.src" ] || curl -sSL -A "TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project)" -o "work/$id.src" "$url"
  case "$(file -b --mime-type "work/$id.src")" in
    application/zip) (cd work && unzip -o -q "$id.src" -d "$id.unz"); src=$(find "work/$id.unz" -iname '*.tif*' -o -iname '*.jp*g' -o -iname '*.png' | head -1);;
    *) src="work/$id.src";;
  esac
  # expand palette to RGB so resampling looks right
  gdal_translate -q -expand rgb "$src" "work/$id.rgb.tif" 2>/dev/null || cp "$src" "work/$id.rgb.tif"
  W=$(gdalinfo -json "work/$id.rgb.tif" | jq '.size[0]'); H=$(gdalinfo -json "work/$id.rgb.tif" | jq '.size[1]')
  hasgeo=$(gdalinfo -json "work/$id.rgb.tif" | jq 'has("coordinateSystem") and (.coordinateSystem.wkt // "" | length > 0)')
  if [ "$hasgeo" != "true" ] && [ "$ngcp" -lt 3 ]; then
    echo "$id has no georeferencing and no control points; making previews"
    gdal_translate -q -of PNG -outsize 1600 0 "work/$id.rgb.tif" "archive/maps/preview/$id-whole.png"
    c=1400
    gdal_translate -q -of PNG -srcwin 0 0 $c $c "work/$id.rgb.tif" "archive/maps/preview/$id-nw.png"
    gdal_translate -q -of PNG -srcwin $((W-c)) 0 $c $c "work/$id.rgb.tif" "archive/maps/preview/$id-ne.png"
    gdal_translate -q -of PNG -srcwin 0 $((H-c)) $c $c "work/$id.rgb.tif" "archive/maps/preview/$id-sw.png"
    gdal_translate -q -of PNG -srcwin $((W-c)) $((H-c)) $c $c "work/$id.rgb.tif" "archive/maps/preview/$id-se.png"
    echo "{\"id\":\"$id\",\"width\":$W,\"height\":$H,\"crop\":$c}" > "archive/maps/preview/$id.json"
    jq -c '.crops // [] | .[]' <<<"$m" | while read -r cr; do
      x=$(jq '.[0]' <<<"$cr"); y=$(jq '.[1]' <<<"$cr"); s=$(jq '.[2]' <<<"$cr")
      gdal_translate -q -of PNG -srcwin $x $y $s $s "work/$id.rgb.tif" "archive/maps/preview/$id-crop-$x-$y.png"
    done
    continue
  fi
  in="work/$id.rgb.tif"
  if [ "$ngcp" -ge 3 ]; then
    args=$(jq -r '.gcps[] | "-gcp \(.[0]) \(.[1]) \(.[2]) \(.[3])"' <<<"$m" | tr '\n' ' ')
    gdal_translate -q -a_srs EPSG:4326 $args "$in" "work/$id.gcp.tif"
    in="work/$id.gcp.tif"
    order=$([ "$ngcp" -ge 6 ] && echo 2 || echo 1)
    gdalwarp -q -order $order -t_srs EPSG:3857 -r bilinear -dstalpha -overwrite "$in" "work/$id.3857.tif"
  else
    gdalwarp -q -t_srs EPSG:3857 -r bilinear -dstalpha -overwrite "$in" "work/$id.3857.tif"
  fi
  rm -rf "public/maps/$id"
  gdal2tiles.py -q --xyz -z "$zooms" -w none -r bilinear --processes=2 "work/$id.3857.tif" "public/maps/$id"
  # keep repository size sensible: convert tiles to palette PNGs if pngquant exists
  command -v pngquant >/dev/null && find "public/maps/$id" -name '*.png' -exec pngquant --force --skip-if-larger --ext .png 128 {} \; || true
  gdalinfo -json "work/$id.3857.tif" | jq '.wgs84Extent' > "public/maps/$id/extent.json" || true
  find "public/maps/$id" -name '*.png' | wc -l > "public/maps/$id/done"
done
