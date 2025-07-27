// merge_gmc_by_category_two.js
// 用法：node merge_gmc_by_category_two.js [国家代码]
// 示例：node merge_gmc_by_category_two.js US
// 如果指定国家代码，只处理该国家目录，否则处理全部

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

// 找到所有 catalog_depth=2 的二级类目
function getSecondLevelCategories(topCat) {
  return (topCat.children || []).filter(cat => cat.catalog_depth === '2');
}

const outputRoot = path.join(__dirname, '../gmc_data/output');
const allCountryDirs = fs.readdirSync(outputRoot).filter(f => fs.statSync(path.join(outputRoot, f)).isDirectory());

// 获取要处理的国家目录
const targetCountry = process.argv[2];
const countryDirs = targetCountry ? 
  allCountryDirs.filter(dir => dir === targetCountry) : 
  allCountryDirs;

if (targetCountry && countryDirs.length === 0) {
  console.error(`错误：找不到国家目录 ${targetCountry}`);
  process.exit(1);
}

function processSecondCategory(country, csvFile, topCat, secondCat, done) {
  const countryDir = path.join(outputRoot, country);
  const csvPath = path.join(countryDir, csvFile);
  const allCodes = new Set(collectAllCodes(secondCat));
  const secondCatDir = path.join(countryDir, topCat.code, secondCat.code);
  if (!fs.existsSync(secondCatDir)) fs.mkdirSync(secondCatDir, { recursive: true });
  const outFile = path.join(secondCatDir, `${secondCat.code}_${country}.csv`);

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
  console.log(`开始处理${targetCountry ? `国家 ${targetCountry}` : '所有国家'}...`);
  for (const country of countryDirs) {
    const countryStartTime = Date.now();
    const countryDir = path.join(outputRoot, country);
    const csvFiles = fs.readdirSync(countryDir).filter(f => f.endsWith('.csv'));
    for (const csvFile of csvFiles) {
      const csvStartTime = Date.now();
      for (const topCat of topCategories) {
        const secondCats = getSecondLevelCategories(topCat);
        for (const secondCat of secondCats) {
          await new Promise((resolve) => processSecondCategory(country, csvFile, topCat, secondCat, resolve));
        }
      }
      const csvDuration = ((Date.now() - csvStartTime) / 1000).toFixed(2);
      console.log(`处理 ${country}/${csvFile} 完成，用时: ${csvDuration} 秒`);
    }
    const countryDuration = ((Date.now() - countryStartTime) / 1000).toFixed(2);
    console.log(`处理国家 ${country} 完成，用时: ${countryDuration} 秒`);
  }
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`全部国家和二级类目处理完成，总用时: ${duration} 秒`);
})(); 