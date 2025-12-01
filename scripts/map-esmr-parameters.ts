#!/usr/bin/env tsx
/**
 * eSMR Parameter Mapping Script
 *
 * Maps 899 eSMR parameters to standardized pollutant names with:
 * - Category assignment (METALS_HEAVY, NUTRIENTS, etc.)
 * - Canonical key mapping to ConfigPollutant
 * - Pattern matching for identification
 *
 * This script analyzes uncategorized eSMRParameter records and generates
 * mapping recommendations for review before database update.
 */

import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Parameter category definitions
enum ParameterCategory {
  METALS_HEAVY = 'METALS_HEAVY',
  METALS_TRACE = 'METALS_TRACE',
  NUTRIENTS = 'NUTRIENTS',
  CONVENTIONAL = 'CONVENTIONAL',
  ORGANICS_VOC = 'ORGANICS_VOC',
  ORGANICS_SVOC = 'ORGANICS_SVOC',
  PESTICIDES = 'PESTICIDES',
  PCBS = 'PCBS',
  PATHOGENS = 'PATHOGENS',
  PHYSICAL = 'PHYSICAL',
  RADIOLOGICAL = 'RADIOLOGICAL',
  PFAS = 'PFAS',
  OTHER = 'OTHER'
}

// Pattern matching rules for categorization
const categoryPatterns = {
  METALS_HEAVY: [
    /\b(lead|pb|arsenic|as|mercury|hg|cadmium|cd|chromium|cr)\b/i,
  ],
  METALS_TRACE: [
    /\b(copper|cu|zinc|zn|iron|fe|aluminum|al|manganese|mn|nickel|ni|silver|ag)\b/i,
  ],
  NUTRIENTS: [
    /\b(nitrogen|nitrate|nitrite|ammonia|phosph|phosphate|po4|no3|no2|nh3|nh4|tkn|total kjeldahl|orthophosphate)\b/i,
  ],
  CONVENTIONAL: [
    /\b(tss|suspended solids|turbidity|oil|grease|o&g|bod|biological oxygen|cod|chemical oxygen|tds|dissolved solids|hardness|alkalinity)\b/i,
  ],
  ORGANICS_VOC: [
    /\b(benzene|toluene|xylene|btex|voc|volatile|ethylbenzene|styrene|dichloroethane|trichloroethylene|trichloroethane|tetrachloroethylene|vinyl chloride|methylene chloride|chloroform|carbon tetrachloride)\b/i,
  ],
  ORGANICS_SVOC: [
    /\b(pah|polycyclic|naphthalene|anthracene|pyrene|benzo|phenanthrene|svoc|semivolatile|phthalate|phenol)\b/i,
  ],
  PESTICIDES: [
    /\b(pesticide|herbicide|insecticide|atrazine|simazine|chlordane|ddt|dieldrin|heptachlor|lindane|toxaphene|aldrin|endrin|chlorpyrifos|diazinon|malathion|parathion|carbaryl|glyphosate|2,4-d|silvex)\b/i,
  ],
  PCBS: [
    /\b(pcb|polychlorinated biphenyl|aroclor)\b/i,
  ],
  PATHOGENS: [
    /\b(coliform|e\.? ?coli|fecal|bacteria|enterococcus|cryptosporidium|giardia|pathogen)\b/i,
  ],
  PHYSICAL: [
    /\b(ph|temperature|temp|conductivity|salinity|color|odor|taste|flow|chlorine|residual|dissolved oxygen|do)\b/i,
  ],
  RADIOLOGICAL: [
    /\b(radium|uranium|radon|alpha|beta|gross alpha|gross beta|radiological)\b/i,
  ],
  PFAS: [
    /\b(pfas|pfoa|pfos|pfna|pfhxs|pfbs|genx|hfpo|perfluor|polyfluor)\b/i,
  ],
};

// Canonical key mappings to ConfigPollutant
const canonicalKeyMappings: Record<string, RegExp[]> = {
  TSS: [/\btss\b|total suspended solids?|suspended solids?/i],
  'O&G': [/\bo&g\b|oil.{0,5}grease|grease.{0,5}oil/i],
  PH: [/\bph\b|ph.{0,5}value|ph.{0,5}units?/i],
  COPPER: [/\bcopper\b|\bcu\b(?!\s*ft)/i],
  ZINC: [/\bzinc\b|\bzn\b/i],
  LEAD: [/\blead\b|\bpb\b/i],
  IRON: [/\biron\b|\bfe\b/i],
  ALUMINUM: [/\baluminum\b|aluminium|\bal\b/i],
  NITRATE: [/\bnitrate\b|\bno3\b|nitrate.{0,10}nitrogen/i],
  PHOSPHORUS: [/\bphosphorus\b|total phosph|\btp\b(?!\s*[0-9])|orthophosphate/i],
  COD: [/\bcod\b|chemical oxygen demand/i],
  BOD: [/\bbod\b|biochemical oxygen|biological oxygen/i],
  ARSENIC: [/\barsenic\b|\bas\b/i],
  MERCURY: [/\bmercury\b|\bhg\b/i],
  CADMIUM: [/\bcadmium\b|\bcd\b/i],
  CHROMIUM: [/\bchromium\b|\bcr\b/i],
  NICKEL: [/\bnickel\b|\bni\b/i],
  SELENIUM: [/\bselenium\b|\bse\b/i],
};

interface ParameterMapping {
  parameterId: string;
  parameterName: string;
  currentCategory: string | null;
  suggestedCategory: ParameterCategory;
  canonicalKey: string | null;
  confidence: 'high' | 'medium' | 'low';
  matchedPattern?: string;
}

/**
 * Categorize a parameter based on pattern matching
 */
function categorizeParameter(parameterName: string): {
  category: ParameterCategory;
  confidence: 'high' | 'medium' | 'low';
  matchedPattern?: string;
} {
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(parameterName)) {
        return {
          category: category as ParameterCategory,
          confidence: 'high',
          matchedPattern: pattern.source,
        };
      }
    }
  }

  return {
    category: ParameterCategory.OTHER,
    confidence: 'low',
  };
}

/**
 * Map parameter to canonical key
 */
function mapToCanonicalKey(parameterName: string): string | null {
  for (const [key, patterns] of Object.entries(canonicalKeyMappings)) {
    for (const pattern of patterns) {
      if (pattern.test(parameterName)) {
        return key;
      }
    }
  }
  return null;
}

/**
 * Main mapping function
 */
async function mapParameters() {
  console.log('📊 eSMR Parameter Mapping Analysis\n');
  console.log('=' .repeat(80));

  // Fetch all parameters
  const parameters = await prisma.eSMRParameter.findMany({
    select: {
      id: true,
      parameterName: true,
      category: true,
      canonicalKey: true,
    },
    orderBy: {
      parameterName: 'asc',
    },
  });

  console.log(`\nTotal parameters: ${parameters.length}`);

  const uncategorized = parameters.filter(p => !p.category);
  console.log(`Uncategorized: ${uncategorized.length}`);
  console.log(`Already categorized: ${parameters.length - uncategorized.length}\n`);

  // Analyze and map parameters
  const mappings: ParameterMapping[] = [];

  for (const param of parameters) {
    const { category, confidence, matchedPattern } = categorizeParameter(param.parameterName);
    const canonicalKey = mapToCanonicalKey(param.parameterName);

    mappings.push({
      parameterId: param.id,
      parameterName: param.parameterName,
      currentCategory: param.category,
      suggestedCategory: category,
      canonicalKey: canonicalKey || param.canonicalKey,
      confidence,
      matchedPattern,
    });
  }

  // Generate statistics
  const byCategoryCount = mappings.reduce((acc, m) => {
    acc[m.suggestedCategory] = (acc[m.suggestedCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Suggested Category Distribution:');
  console.log('-'.repeat(80));
  for (const [category, count] of Object.entries(byCategoryCount).sort((a, b) => b[1] - a[1])) {
    const percentage = ((count / mappings.length) * 100).toFixed(1);
    console.log(`${category.padEnd(25)} ${count.toString().padStart(5)} (${percentage}%)`);
  }

  // High confidence mappings
  const highConfidence = mappings.filter(m => m.confidence === 'high');
  console.log(`\nHigh confidence mappings: ${highConfidence.length}`);

  // Canonical key mappings
  const withCanonicalKey = mappings.filter(m => m.canonicalKey);
  console.log(`Parameters with canonical key: ${withCanonicalKey.length}`);

  // Output detailed mapping to file
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'esmr-parameter-mapping.json');
  fs.writeFileSync(outputFile, JSON.stringify(mappings, null, 2));
  console.log(`\n✅ Detailed mapping saved to: ${outputFile}`);

  // Generate summary by category
  const summaryFile = path.join(outputDir, 'esmr-parameter-summary.txt');
  let summaryContent = 'eSMR Parameter Mapping Summary\n';
  summaryContent += '='.repeat(80) + '\n\n';

  for (const category of Object.keys(ParameterCategory)) {
    const categoryParams = mappings.filter(m => m.suggestedCategory === category);
    if (categoryParams.length > 0) {
      summaryContent += `\n${category} (${categoryParams.length})\n`;
      summaryContent += '-'.repeat(80) + '\n';
      categoryParams.slice(0, 50).forEach(p => {
        const keyInfo = p.canonicalKey ? ` → ${p.canonicalKey}` : '';
        summaryContent += `  ${p.parameterName}${keyInfo}\n`;
      });
      if (categoryParams.length > 50) {
        summaryContent += `  ... and ${categoryParams.length - 50} more\n`;
      }
    }
  }

  fs.writeFileSync(summaryFile, summaryContent);
  console.log(`📄 Summary report saved to: ${summaryFile}`);

  // Ask if user wants to apply mappings
  console.log('\n' + '='.repeat(80));
  console.log('\n⚠️  Review the mapping files before applying to database');
  console.log('To apply these mappings, run: npm run db:apply-parameter-mapping\n');

  return mappings;
}

/**
 * Apply mappings to database
 */
async function applyMappings(mappings: ParameterMapping[]) {
  console.log('\n📝 Applying parameter mappings to database...\n');

  let updateCount = 0;
  for (const mapping of mappings) {
    if (mapping.confidence !== 'low' || mapping.canonicalKey) {
      await prisma.eSMRParameter.update({
        where: { id: mapping.parameterId },
        data: {
          category: mapping.suggestedCategory,
          canonicalKey: mapping.canonicalKey,
        },
      });
      updateCount++;
    }
  }

  console.log(`✅ Updated ${updateCount} parameters`);
}

// Main execution
async function main() {
  try {
    const mappings = await mapParameters();

    // Check if --apply flag is passed
    if (process.argv.includes('--apply')) {
      await applyMappings(mappings);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
