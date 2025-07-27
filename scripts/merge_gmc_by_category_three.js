// merge_gmc_by_category_three.js
// 用法：node merge_gmc_by_category_three.js [国家代码]
// 示例：node merge_gmc_by_category_three.js US
// 递归处理gmc_data/output下所有国家目录下的所有一级类目下的所有二级类目下的csv，
// 生成该一级类目下所有二级类目的三级类目文件夹，并合并csv到对应三级类目目录下
// 如果指定国家代码，则只处理该国家目录

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

// 找到所有 catalog_depth=3 的三级类目
function getThirdLevelCategories(secondCat) {
  return (secondCat.children || []).filter(cat => cat.catalog_depth === '3');
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

function processThirdCategory(country, csvFile, topCat, secondCat, thirdCat, done) {
  const countryDir = path.join(outputRoot, country);
  const csvPath = path.join(countryDir, csvFile);
  const allCodes = new Set(collectAllCodes(thirdCat));
  const thirdCatDir = path.join(countryDir, topCat.code, secondCat.code, thirdCat.code);
  if (!fs.existsSync(thirdCatDir)) fs.mkdirSync(thirdCatDir, { recursive: true });
  const outFile = path.join(thirdCatDir, `${thirdCat.code}_${country}.csv`);

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
          const thirdCats = getThirdLevelCategories(secondCat);
          for (const thirdCat of thirdCats) {
            await new Promise((resolve) => processThirdCategory(country, csvFile, topCat, secondCat, thirdCat, resolve));
          }
        }
      }
      const csvDuration = ((Date.now() - csvStartTime) / 1000).toFixed(2);
      console.log(`处理 ${country}/${csvFile} 完成，用时: ${csvDuration} 秒`);
    }
    const countryDuration = ((Date.now() - countryStartTime) / 1000).toFixed(2);
    console.log(`处理国家 ${country} 完成，用时: ${countryDuration} 秒`);
  }
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`全部国家和三级类目处理完成，总用时: ${duration} 秒`);
})(); 