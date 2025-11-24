# Stormwater Watch Geodata Files

Geographic data files for spatial enrichment of industrial facilities and subscription matching.

## Download Status

- **[✓] california-counties.geojson** - Downloaded and ready (58 county features)
- **[⚠️] huc12-california.geojson** - Placeholder created, manual download required
- **[⚠️] calenviroscreen-dacs.geojson** - Placeholder created, manual download required
- **[⚠️] ms4-boundaries.geojson** - Placeholder created, regional data required

## File Descriptions

### california-counties.geojson
- **Status**: Ready for use
- **Source**: Code for America - Click That Hood
- **Features**: 58 California county boundaries
- **Geometry**: MultiPolygon
- **Use Case**: County-based facility subscriptions and geographic filtering
- **Download Date**: Nov 23, 2025

### huc12-california.geojson
- **Status**: Needs manual download and processing
- **Required for**: Watershed-based enrichment and water quality context
- **Geometry**: MultiPolygon (expected)
- **Data Source**: USGS National Map Downloader
- **Instructions**:
  1. Visit https://apps.nationalmap.gov/downloader/
  2. Search for California
  3. Select **Hydrography** > **Watershed Boundary Dataset (WBD)**
  4. Download **HU-8 Region 18** (California region)
  5. Extract the shapefile
  6. Convert to GeoJSON using:
     ```bash
     ogr2ogr -f GeoJSON huc12-california.geojson HUC_12.shp
     ```
  7. Replace the placeholder file with the downloaded GeoJSON
- **Alternative**: Check if USGS provides direct GeoJSON downloads for California HUC12

### calenviroscreen-dacs.geojson
- **Status**: Needs manual download and conversion
- **Required for**: Environmental justice screening and DAC identification
- **Geometry**: Polygon/MultiPolygon (expected)
- **Data Source**: California OEHHA CalEnviroScreen 4.0
- **Instructions**:
  1. Download from https://oehha.ca.gov/calenviroscreen/maps-data/download-data
  2. Get **calenviroscreen40shpf2021shp.zip**
  3. Extract all shapefile components (.shp, .shx, .dbf, .prj, .cpg)
  4. Convert and filter for disadvantaged communities (CIscoreP >= 75):
     ```bash
     ogr2ogr -f GeoJSON calenviroscreen-dacs.geojson \
       calenviroscreen40shpf2021shp.shp \
       -where "CIscoreP >= 75"
     ```
  5. Or use QGIS:
     - Open the shapefile
     - Filter: `CIscoreP >= 75`
     - Export as GeoJSON
  6. Replace the placeholder file

### ms4-boundaries.geojson
- **Status**: Needs regional data collection
- **Required for**: Municipal stormwater jurisdiction mapping
- **Geometry**: MultiPolygon (expected)
- **Data Source**: California Regional Water Quality Control Boards
- **Note**: MS4 boundaries are regional; you may need multiple data sources

**Data Sources by Region**:
- **San Francisco Bay RWQCB**: https://www.waterboards.ca.gov/sanfranciscobay/
- **Los Angeles RWQCB**: https://data.lacity.org/
- **San Diego RWQCB**: https://sdgis-sandag.opendata.arcgis.com/
- **Central Coast RWQCB**: Regional office websites
- **Central Valley RWQCB**: Regional office websites
- **All Regional Boards**: https://www.waterboards.ca.gov/waterboards_map.html

**Instructions**:
1. Identify which regions/municipalities your platform covers
2. Download MS4 boundary data from appropriate regional water boards
3. Standardize to a consistent format (GeoJSON)
4. Combine into single file or keep separate by region
5. Add MS4 district/jurisdiction identifiers as properties
6. Replace the placeholder file

## Integration with Stormwater Watch

These files are used by the spatial enrichment system (`lib/enrichment/spatial.ts`) to:

1. **Point-in-Polygon Matching**: Uses Turf.js to match facility coordinates against boundaries
2. **Attribute Enrichment**: Adds county, watershed, DAC status, and MS4 jurisdiction data
3. **Subscription Filtering**: Enables users to filter and subscribe to facilities by:
   - County
   - Watershed (HUC12)
   - Disadvantaged community status
   - MS4 jurisdiction

## Next Steps

1. **Immediate** (Already Complete):
   - [x] California counties downloaded and verified
   - [x] Placeholder files created with instructions

2. **Short-term** (This Week):
   - [ ] Download and convert HUC12 watersheds
   - [ ] Download and convert CalEnviroScreen DACs
   - [ ] Test spatial enrichment with sample facilities

3. **Medium-term** (As Needed):
   - [ ] Obtain MS4 boundary data from regional sources
   - [ ] Validate enrichment accuracy
   - [ ] Optimize file sizes if needed (tile/simplify geometries)

4. **Testing**:
   - [ ] Run spatial enrichment endpoint: `npm run enrich` or test route at `/api/enrichment/spatial`
   - [ ] Verify facilities are matched to correct counties/watersheds
   - [ ] Validate DAC identification
   - [ ] Check dashboard displays enriched data correctly

## File Formats

All files should be in GeoJSON format with the following structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "...",
        "id": "...",
        ...
      },
      "geometry": {
        "type": "MultiPolygon" | "Polygon",
        "coordinates": [...]
      }
    }
  ]
}
```

## Validation

To validate GeoJSON files:

```bash
# Using Python
python3 -c "import json; json.load(open('filename.geojson'))"

# Using Node.js
node -e "console.log(JSON.stringify(require('./filename.geojson'), null, 2))"

# Using jq (if installed)
jq . filename.geojson
```

## Performance Notes

- **california-counties.geojson** (407 KB): Well-optimized, fast queries
- **huc12-california.geojson**: May be large (>100 MB), consider simplifying geometries for web use
- **calenviroscreen-dacs.geojson**: Size depends on feature count
- **ms4-boundaries.geojson**: Size depends on coverage and detail

For web performance, consider:
- Using GeoJSON simplification tools (e.g., Mapshaper)
- Reducing decimal precision in coordinates
- Using spatial indexing if performance becomes an issue

## Resources

- **USGS National Map Downloader**: https://apps.nationalmap.gov/downloader/
- **CalEnviroScreen Data**: https://oehha.ca.gov/calenviroscreen/
- **California Water Boards**: https://www.waterboards.ca.gov/
- **Turf.js Documentation**: https://turfjs.org/
- **GeoJSON Specification**: https://tools.ietf.org/html/rfc7946
