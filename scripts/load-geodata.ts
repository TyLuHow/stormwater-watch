/**
 * Script to load and prepare geodata for spatial enrichment
 * 
 * Usage: npm run script:load-geodata
 * Or: npx tsx scripts/load-geodata.ts
 */

import * as fs from "fs"
import * as path from "path"

const GEODATA_DIR = path.join(process.cwd(), "public", "geodata")

interface GeoDataSource {
  name: string
  filename: string
  url: string
  description: string
}

const GEODATA_SOURCES: GeoDataSource[] = [
  {
    name: "California Counties",
    filename: "california-counties.geojson",
    url: "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/california-counties.geojson",
    description: "California county boundaries from Census TIGER files",
  },
  {
    name: "HUC12 Watersheds",
    filename: "huc12-california.geojson",
    url: "https://www.usgs.gov/national-hydrography/watershed-boundary-dataset",
    description: "USGS Watershed Boundary Dataset (HUC12) for California - requires manual download",
  },
  {
    name: "CalEnviroScreen DACs",
    filename: "calenviroscreen-dacs.geojson",
    url: "https://oehha.ca.gov/calenviroscreen/maps-data",
    description: "CalEnviroScreen 4.0 disadvantaged communities - requires manual download",
  },
  {
    name: "MS4 Jurisdictions",
    filename: "ms4-boundaries.geojson",
    url: "https://gis.data.ca.gov/",
    description: "Phase I MS4 permit boundaries - requires manual download from regional water boards",
  },
]

async function downloadFile(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to download: ${response.statusText}`)
      return false
    }
    const data = await response.text()
    fs.writeFileSync(destPath, data)
    return true
  } catch (error) {
    console.error("Download error:", error)
    return false
  }
}

function createPlaceholderGeoJSON(filename: string, description: string) {
  const placeholder = {
    type: "FeatureCollection",
    features: [],
    metadata: {
      note: `This is a placeholder file. ${description}`,
      instructions: "Replace this file with actual geodata from the specified source",
    },
  }
  return JSON.stringify(placeholder, null, 2)
}

async function main() {
  console.log("🌍 Geodata Loading Script")
  console.log("=" .repeat(60))

  // Ensure geodata directory exists
  if (!fs.existsSync(GEODATA_DIR)) {
    console.log(`Creating directory: ${GEODATA_DIR}`)
    fs.mkdirSync(GEODATA_DIR, { recursive: true })
  }

  for (const source of GEODATA_SOURCES) {
    const destPath = path.join(GEODATA_DIR, source.filename)
    console.log(`\n📦 ${source.name}`)
    console.log(`   File: ${source.filename}`)

    if (fs.existsSync(destPath)) {
      const stats = fs.statSync(destPath)
      const sizeKB = (stats.size / 1024).toFixed(2)
      console.log(`   ✅ Already exists (${sizeKB} KB)`)
      
      // Check if it's a placeholder
      const content = fs.readFileSync(destPath, "utf-8")
      if (content.includes("placeholder")) {
        console.log(`   ⚠️  This is a placeholder file - needs replacement`)
      }
      continue
    }

    // Try to download (will only work for publicly available files)
    console.log(`   📥 Attempting download from ${source.url}`)
    
    const downloaded = await downloadFile(source.url, destPath)
    
    if (!downloaded) {
      // Create placeholder
      console.log(`   ⚠️  Could not download - creating placeholder`)
      console.log(`   Manual download required from: ${source.url}`)
      const placeholder = createPlaceholderGeoJSON(source.filename, source.description)
      fs.writeFileSync(destPath, placeholder)
    } else {
      console.log(`   ✅ Downloaded successfully`)
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("📌 Next Steps:")
  console.log("1. For files that couldn't be auto-downloaded, manually download from the URLs above")
  console.log("2. Convert downloaded files to GeoJSON if needed")
  console.log("3. Place files in public/geodata/ directory")
  console.log("4. Run enrichment: curl -X POST http://localhost:3000/api/enrichment/spatial")
  console.log("\n✨ For development, the system will work with placeholder files (mock data mode)")
}

main().catch(console.error)




