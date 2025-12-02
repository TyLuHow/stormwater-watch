import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const oilGrease = await prisma.configPollutant.findUnique({
    where: { key: 'O&G' }
  });
  console.log('O&G pollutant:', JSON.stringify(oilGrease, null, 2));
  
  if (!oilGrease) {
    console.log('\nO&G pollutant does not exist. Creating it...');
    const created = await prisma.configPollutant.create({
      data: {
        key: 'O&G',
        aliases: ['Oil and Grease', 'Oil & Grease', 'O & G'],
        canonicalUnit: 'mg/L',
        category: 'PHYSICAL'
      }
    });
    console.log('Created:', JSON.stringify(created, null, 2));
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
