const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Papa = require('papaparse');

// 递归收集所有子类目 code
function collectAllCodes(category) {
  let codes = [category.code];
  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      codes = codes.concat(collectAllCodes(child));
    }
  }
  return codes;
}

// 读取 categories.json
const categoriesPath = path.join(__dirname, '../public/categories.json');
const categoriesRaw = fs.readFileSync(categoriesPath, 'utf8');
const categories = JSON.parse(categoriesRaw);

// 找到所有 catalog_depth=1 的一级类目
const topCategories = categories.filter(cat => cat.catalog_depth === '1');

const outputRoot = path.join(__dirname, '../gmc_data/output');
const countryDirs = fs.readdirSync(outputRoot).filter(f => fs.statSync(path.join(outputRoot, f)).isDirectory());

function processOneCategory(country, csvFile, topCat, done) {
  const countryDir = path.join(outputRoot, country);
  const csvPath = path.join(countryDir, csvFile);
  const allCodes = new Set(collectAllCodes(topCat));
  const catDir = path.join(countryDir, topCat.code);
  if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
  const outFile = path.join(catDir, `${topCat.code}_${country}.csv`);

  // 先写表头
  const firstLine = fs.readFileSync(csvPath, 'utf8').split('\n')[0];
  const header = firstLine.split(',');
  fs.writeFileSync(outFile, firstLine + '\n', 'utf8');
  const writer = fs.createWriteStream(outFile, { flags: 'a' });

  let count = 0;
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      if (allCodes.has(row.ranking_category)) {
        // 用 papaparse.unparse 写一行，保证转义
        const csvLine = Papa.unparse([row], { header: false, columns: header }) + '\n';
        writer.write(csvLine);
        count++;
      }
    })
    .on('end', () => {
      writer.end();
      console.log(`已生成: ${outFile} (${count} 条)`);
      done();
    });
}

// 主流程：串行处理，避免内存压力
(async function main() {
  const startTime = Date.now();
  for (const country of countryDirs) {
    const countryDir = path.join(outputRoot, country);
    const csvFiles = fs.readdirSync(countryDir).filter(f => f.endsWith('.csv'));
    for (const csvFile of csvFiles) {
      for (const topCat of topCategories) {
        await new Promise((resolve) => processOneCategory(country, csvFile, topCat, resolve));
      }
    }
  }
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`全部国家和类目处理完成，总用时: ${duration} 秒`);
})(); 