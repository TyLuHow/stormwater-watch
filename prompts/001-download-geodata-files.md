<objective>
Download and install required GeoJSON geodata files for the Stormwater Watch platform's spatial enrichment features. These files enable the system to match facilities with counties, watersheds (HUC12), disadvantaged communities (DACs via CalEnviroScreen), and MS4 jurisdiction boundaries.

This is critical for the spatial subscription system and facility enrichment functionality.
</objective>

<context>
The Stormwater Watch platform performs spatial enrichment of industrial facilities to enable geographic filtering and subscription matching. The system requires four GeoJSON files containing California boundary data.

Project location: Stormwater Watch nonprofit platform (Next.js 14)
Target directory: `./public/geodata/`
Used by: `lib/enrichment/spatial.ts` for point-in-polygon matching with Turf.js
</context>

<requirements>
Download and verify the following four GeoJSON files:

1. **California Counties** - County boundary polygons for county-based subscriptions
2. **HUC12 Watersheds** - Hydrologic Unit Code 12 watershed boundaries for water quality context
3. **CalEnviroScreen DACs** - Disadvantaged communities (≥75th percentile) for environmental justice tracking
4. **MS4 Boundaries** - Municipal Separate Storm Sewer System jurisdiction boundaries

For each file:
- Download to `./public/geodata/[filename].geojson`
- Verify it's valid GeoJSON (contains "FeatureCollection" and "features" array)
- Report feature count if successful
- Create placeholder with download instructions if curl fails
</requirements>

<implementation>
Execute the following downloads sequentially:

1. Create geodata directory:
```bash
mkdir -p public/geodata
cd public/geodata
```

2. **California Counties**:
```bash
curl -L "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson" -o california-counties.geojson

# Verify (requires jq - if not installed, skip verification)
if command -v jq &> /dev/null; then
  echo "✓ Counties: $(jq '.features | length' california-counties.geojson) features"
else
  echo "✓ california-counties.geojson downloaded (jq not available for verification)"
fi
```

3. **HUC12 Watersheds** (Large file - create placeholder):
This file is >100MB. Create a placeholder with manual download instructions:
```bash
echo '{
  "type": "FeatureCollection",
  "features": [],
  "_note": "MANUAL DOWNLOAD REQUIRED",
  "_instructions": "Download California HUC12 watersheds from USGS National Map Downloader:",
  "_url": "https://apps.nationalmap.gov/downloader/",
  "_steps": [
    "1. Go to https://apps.nationalmap.gov/downloader/",
    "2. Search for California",
    "3. Select Hydrography > Watershed Boundary Dataset (WBD)",
    "4. Download HU-8 Region 18 (California)",
    "5. Extract and convert to GeoJSON",
    "6. Filter for HUC12 level",
    "7. Replace this file with filtered GeoJSON"
  ]
}' | jq '.' > huc12-california.geojson
echo "⚠️  huc12-california.geojson: Placeholder created - manual download required"
```

4. **CalEnviroScreen DACs** (Shapefile - needs conversion):
Create placeholder with instructions:
```bash
echo '{
  "type": "FeatureCollection",
  "features": [],
  "_note": "MANUAL DOWNLOAD AND CONVERSION REQUIRED",
  "_instructions": "Download CalEnviroScreen 4.0 shapefile and convert to GeoJSON:",
  "_url": "https://oehha.ca.gov/calenviroscreen/maps-data/download-data",
  "_steps": [
    "1. Download calenviroscreen40shpf2021shp.zip from OEHHA",
    "2. Extract shapefile",
    "3. Filter for CIscoreP >= 75 (disadvantaged communities)",
    "4. Convert to GeoJSON using ogr2ogr or QGIS",
    "5. Replace this file with converted GeoJSON"
  ]
}' | jq '.' > calenviroscreen-dacs.geojson
echo "⚠️  calenviroscreen-dacs.geojson: Placeholder created - manual download required"
```

5. **MS4 Boundaries** (Regional data - placeholder):
```bash
echo '{
  "type": "FeatureCollection",
  "features": [],
  "_note": "REGIONAL DATA - OBTAIN FROM LOCAL SOURCES",
  "_instructions": "MS4 boundaries vary by region. Obtain from:",
  "_sources": [
    "California Regional Water Quality Control Boards",
    "County GIS/Open Data portals",
    "Municipal stormwater program websites"
  ],
  "_example_sources": {
    "San Francisco Bay": "https://www.waterboards.ca.gov/sanfranciscobay/",
    "Los Angeles": "https://data.lacity.org/",
    "San Diego": "https://sdgis-sandag.opendata.arcgis.com/"
  }
}' | jq '.' > ms4-boundaries.geojson
echo "⚠️  ms4-boundaries.geojson: Placeholder created - obtain from regional sources"
```
</implementation>

<error_handling>
Handle common failure scenarios gracefully:

- **curl fails**: Create placeholder file with download instructions (already implemented above)
- **jq not installed**: Skip feature count verification, just report download success
- **Invalid URL**: Report error and create placeholder
- **Permission denied**: Report error with suggestion to check directory permissions

Do NOT fail the entire process if one file fails. Continue with remaining downloads and report status for each.
</error_handling>

<output>
After completing all downloads, generate a summary report and save to `./public/geodata/README.md`:

```markdown
# Geodata Files for Stormwater Watch

## Status

- [✓/⚠️] california-counties.geojson - [STATUS]
- [✓/⚠️] huc12-california.geojson - [STATUS]
- [✓/⚠️] calenviroscreen-dacs.geojson - [STATUS]
- [✓/⚠️] ms4-boundaries.geojson - [STATUS]

## Files Requiring Manual Download

[List files that need manual download with instructions]

## Next Steps

1. For placeholder files, follow the instructions in each JSON file
2. After adding real data, verify with: `npm run enrich` (spatial enrichment endpoint)
3. Test facility enrichment in dashboard

## File Descriptions

- **california-counties.geojson**: CA county boundaries for jurisdiction-based subscriptions
- **huc12-california.geojson**: Watershed boundaries (HUC12 level) for water quality context
- **calenviroscreen-dacs.geojson**: Disadvantaged communities (CES 4.0, ≥75th percentile)
- **ms4-boundaries.geojson**: Municipal stormwater jurisdiction boundaries
```
</output>

<verification>
Before declaring complete, verify:

1. Directory `./public/geodata/` exists and contains 4 .geojson files
2. `california-counties.geojson` is valid GeoJSON (if curl succeeded)
3. Placeholder files contain proper JSON structure with instructions
4. README.md is created with status summary
5. Report clearly indicates which files are ready and which need manual steps

Check file existence:
```bash
ls -lh public/geodata/
```

Test GeoJSON validity for downloaded files:
```bash
for file in public/geodata/*.geojson; do
  if command -v jq &> /dev/null; then
    if jq empty "$file" 2>/dev/null; then
      echo "✓ $file is valid JSON"
    else
      echo "✗ $file is invalid JSON"
    fi
  fi
done
```
</verification>

<success_criteria>
- All 4 .geojson files exist in `./public/geodata/`
- At least 1 file (california-counties) successfully downloaded with actual data
- Placeholder files contain clear instructions for manual download
- README.md created with current status
- User knows exactly which files need manual action
- No errors that would block spatial enrichment functionality once real data is added
</success_criteria>
