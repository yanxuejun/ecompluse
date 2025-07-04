console.log('脚本开始执行');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(__dirname, '../google_taxonomy_parsed-1.csv');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  for (const row of records) {
    await prisma.google_Product_Taxonomy.upsert({
      where: { code: Number(row.code) },
      update: {},
      create: {
        code: Number(row.code),
        catalog_name: row.catalog_name,
        catalog_depth: Number(row.catalog_depth),
        parent_catalog_code: Number(row.parent_catalog_code),
        full_catalog_name: row.full_catalog_name,
      },
    });
  }
  console.log('导入完成');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });