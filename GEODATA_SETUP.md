# Stormwater Watch Geodata Setup - Quick Reference

## Completion Status

### Completed (Ready to Use)
- ✓ **california-counties.geojson** - 58 county features, fully downloaded

### Pending (Manual Download Required)
- ⚠️ **huc12-california.geojson** - Placeholder created with instructions
- ⚠️ **calenviroscreen-dacs.geojson** - Placeholder created with instructions
- ⚠️ **ms4-boundaries.geojson** - Placeholder created with instructions

## Quick Setup Commands

### 1. Download HUC12 Watersheds

Option A: Manual download from USGS
```bash
# Visit: https://apps.nationalmap.gov/downloader/
# 1. Search: California
# 2. Select: Hydrography > Watershed Boundary Dataset (WBD)
# 3. Download: HU-8 Region 18
# 4. Extract and convert to GeoJSON
```

Option B: If USGS provides GeoJSON directly
```bash
cd public/geodata
curl -L "[USGS_GEOJSON_URL]" -o huc12-california.geojson
```

### 2. Download CalEnviroScreen DACs

```bash
cd public/geodata

# Download the zip file
curl -L "https://oehha.ca.gov/calenviroscreen/maps-data/download-data" \
  -o calenviroscreen40.zip

# Extract
unzip calenviroscreen40.zip

# Convert and filter to DACs (CIscoreP >= 75)
ogr2ogr -f GeoJSON calenviroscreen-dacs.geojson \
  calenviroscreen40shpf2021shp.shp \
  -where "CIscoreP >= 75"

# Cleanup
rm calenviroscreen40.zip calenviroscreen40shpf2021shp.*
```

If ogr2ogr is not installed:
```bash
# Ubuntu/Debian
sudo apt-get install gdal-bin

# macOS
brew install gdal

# Or use QGIS for conversion
```

### 3. Obtain MS4 Boundaries

This requires collecting data from multiple regional sources:

```bash
cd public/geodata

# Example: If combining multiple regions, create a merged file
# Each region may have different formats and structure

# After collecting all regional MS4 data:
# 1. Convert each to GeoJSON format
# 2. Combine into single file or create regional variants
# 3. Ensure properties include jurisdiction name and region identifiers
# 4. Replace ms4-boundaries.geojson placeholder
```

**Regional Board Contact Links**:
- San Francisco Bay: https://www.waterboards.ca.gov/sanfranciscobay/
- Los Angeles: https://www.waterboards.ca.gov/losangeles/
- San Diego: https://www.waterboards.ca.gov/sandiego/
- Central Coast: https://www.waterboards.ca.gov/centralcoast/
- Central Valley: https://www.waterboards.ca.gov/centralvalley/
- North Coast: https://www.waterboards.ca.gov/northcoast/
- Lahontan: https://www.waterboards.ca.gov/lahontan/

## Validation After Download

Test each file for valid GeoJSON:

```bash
cd public/geodata

# Test with Python
python3 -c "
import json, sys
try:
    data = json.load(open(sys.argv[1]))
    print(f'✓ Valid GeoJSON - {len(data.get(\"features\", []))} features')
except Exception as e:
    print(f'✗ Invalid: {e}')
" california-counties.geojson

# Or check file structure
for file in *.geojson; do
  echo "Checking: \$file"
  head -1 \$file | grep -q '"type"' && echo "  ✓ Valid JSON" || echo "  ✗ Invalid JSON"
done
```

## Testing Spatial Enrichment

After adding real data to all files:

```bash
# Test the enrichment endpoint
curl -X POST http://localhost:3000/api/enrichment/spatial \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194
  }'

# Expected response includes county, watershed, DAC status
```

## File Storage Location

All geodata files are stored in:
```
/mnt/c/Users/Tyler Luby Howard/Downloads/code/public/geodata/
```

Accessed in application code via:
```javascript
import fs from 'fs';
const data = JSON.parse(
  fs.readFileSync('./public/geodata/california-counties.geojson', 'utf-8')
);
```

## Architecture Notes

The spatial enrichment system uses:
- **Turf.js**: Point-in-polygon matching (booleanPointInPolygon)
- **GeoJSON**: Standard format for all boundary data
- **Express API**: `/api/enrichment/spatial` route for enrichment requests
- **Client-side**: Subscription filtering in dashboard

## Performance Considerations

Current file sizes:
- california-counties.geojson: 416 KB (ready, well-optimized)
- huc12-california.geojson: Expected 50-200 MB (may need optimization)
- calenviroscreen-dacs.geojson: Expected 10-50 MB (depends on feature count)
- ms4-boundaries.geojson: Expected 5-100 MB (depends on coverage)

If performance issues occur:
1. Simplify geometries using Mapshaper
2. Reduce coordinate precision
3. Consider spatial indexing for large files
4. Split into regional tiles

## Troubleshooting

**Issue**: "Feature not found" in enrichment results
- **Solution**: Verify GeoJSON is valid, check coordinate order (lon, lat)

**Issue**: Large file sizes slow down application
- **Solution**: Use Mapshaper to simplify geometries

**Issue**: Unable to download from USGS/OEHHA
- **Solution**: Contact the data providers directly or check for alternative sources

**Issue**: ogr2ogr conversion fails
- **Solution**: Ensure GDAL is installed, check shapefile integrity

## Next Actions

1. **This week**: Download HUC12 and CalEnviroScreen data
2. **Next week**: Obtain MS4 boundary data from regional boards
3. **Before launch**: Validate all enrichment data with sample facilities
4. **Post-launch**: Monitor enrichment accuracy and adjust if needed
