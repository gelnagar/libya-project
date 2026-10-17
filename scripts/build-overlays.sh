#!/usr/bin/env bash
# Downloads each historical map in archive/maps/overlays.json and cuts it into web map tiles
# under public/maps/<id>/{z}/{x}/{y}.png. Needs gdal-bin and jq. Run by .github/workflows/maps.yml.
set -euo pipefail
mkdir -p work public/maps
jq -c '.[]' archive/maps/overlays.json | while read -r m; do
  id=$(jq -r .id <<<"$m"); url=$(jq -r .url <<<"$m"); zooms=$(jq -r .zooms <<<"$m")
  [ -d "public/maps/$id" ] && { echo "$id already tiled"; continue; }
  echo "== $id"
  curl -sSL -A "TripoliOpenSourceArchive/1.0 (github.com/gelnagar/libya-project)" -o "work/$id.src" "$url"
  file "work/$id.src" | tee "archive/maps/$id.info.txt"
  ls -la "work/$id.src" >> "archive/maps/$id.info.txt"
  case "$(file -b --mime-type "work/$id.src")" in
    application/zip) (cd work && unzip -o -q "$id.src" -d "$id.unz"); src=$(find "work/$id.unz" -iname '*.tif*' | head -1);;
    *) src="work/$id.src";;
  esac
  gdalinfo "$src" | head -60 >> "archive/maps/$id.info.txt" || true
  # Reproject to web mercator with transparent edges, then tile.
  gdalwarp -q -t_srs EPSG:3857 -r bilinear -dstalpha -overwrite "$src" "work/$id.3857.tif" || { echo "warp failed for $id"; continue; }
  gdal2tiles.py -q --xyz -z "$zooms" -w none -r bilinear --processes=2 "work/$id.3857.tif" "public/maps/$id"
  find "public/maps/$id" -name '*.png' | wc -l >> "archive/maps/$id.info.txt"
  gdalinfo -json "work/$id.3857.tif" | jq '.wgs84Extent' > "public/maps/$id/extent.json" || true
done
