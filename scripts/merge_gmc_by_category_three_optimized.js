// merge_gmc_by_category_three_optimized.js
// 用法：node merge_gmc_by_category_three_optimized.js [国家代码]
// 示例：node merge_gmc_by_category_three_optimized.js US
// 优化版本：只处理二级类目下的CSV，输出到三级类目目录

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Papa = require('papaparse');

// 缓存 categories.json 解析结果
let categoriesCache = null;
let topCategoriesCache = null;

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

// 获取缓存的 categories 数据
function getCategories() {
  if (!categoriesCache) {
    const categoriesPath = path.join(__dirname, '../public/categories.json');
    const categoriesRaw = fs.readFileSync(categoriesPath, 'utf8');
    categoriesCache = JSON.parse(categoriesRaw);
  }
  return categoriesCache;
}

// 获取缓存的顶级类目
function getTopCategories() {
  if (!topCategoriesCache) {
    const categories = getCategories();
    topCategoriesCache = categories.filter(cat => cat.catalog_depth === '1');
  }
  return topCategoriesCache;
}

// 找到所有 catalog_depth=2 的二级类目
function getSecondLevelCategories(topCat) {
  return (topCat.children || []).filter(cat => cat.catalog_depth === '2');
}

// 找到所有 catalog_depth=3 的三级类目
function getThirdLevelCategories(secondCat) {
  return (secondCat.children || []).filter(cat => cat.catalog_depth === '3');
}

// 查找二级类目目录下的CSV文件
function findCsvFilesInSecondLevelDirs(countryDir) {
  const csvFiles = [];
  
  // 遍历国家目录下的所有一级类目目录
  const topLevelDirs = fs.readdirSync(countryDir).filter(f => {
    const fullPath = path.join(countryDir, f);
    return fs.statSync(fullPath).isDirectory();
  });
  
  for (const topLevelDir of topLevelDirs) {
    const topLevelPath = path.join(countryDir, topLevelDir);
    
    // 遍历一级类目下的所有二级类目目录
    const secondLevelDirs = fs.readdirSync(topLevelPath).filter(f => {
      const fullPath = path.join(topLevelPath, f);
      return fs.statSync(fullPath).isDirectory();
    });
    
    for (const secondLevelDir of secondLevelDirs) {
      const secondLevelPath = path.join(topLevelPath, secondLevelDir);
      
      // 查找二级类目目录下的CSV文件
      const csvFilesInDir = fs.readdirSync(secondLevelPath).filter(f => f.endsWith('.csv'));
      
      for (const csvFile of csvFilesInDir) {
        csvFiles.push({
          path: path.join(secondLevelPath, csvFile),
          topLevel: topLevelDir,
          secondLevel: secondLevelDir,
          filename: csvFile
        });
      }
    }
  }
  
  return csvFiles;
}

// 预过滤：检查哪些类目有数据
async function checkCategoriesWithData(country) {
  const countryDir = path.join(__dirname, '../gmc_data/output', country);
  
  if (!fs.existsSync(countryDir)) {
    console.log(`警告：国家目录 ${countryDir} 不存在`);
    return new Set();
  }
  
  // 查找二级类目目录下的CSV文件
  const csvFiles = findCsvFilesInSecondLevelDirs(countryDir);
  console.log(`在 ${country} 目录下找到 ${csvFiles.length} 个CSV文件（在二级类目目录中）`);
  
  const categorySet = new Set();
  
  for (const csvFile of csvFiles) {
    await new Promise((resolve) => {
      const stream = fs.createReadStream(csvFile.path);
      const parser = csv();
      
      parser.on('data', (row) => {
        if (row.ranking_category) {
          categorySet.add(row.ranking_category);
        }
      });
      
      parser.on('end', () => {
        console.log(`从 ${csvFile.filename} 读取到 ${categorySet.size} 个类目`);
        resolve();
      });
      
      stream.pipe(parser);
    });
  }
  
  return categorySet;
}

// 处理单个三级类目
function processThirdCategory(country, csvFileInfo, topCat, secondCat, thirdCat, validCategories, done) {
  const allCodes = new Set(collectAllCodes(thirdCat));
  
  // 检查该类目是否有数据（优化：跳过没有数据的类目）
  const hasData = Array.from(allCodes).some(code => validCategories.has(code));
  if (!hasData) {
    done(); // 跳过没有数据的类目
    return;
  }
  
  // 创建三级类目目录
  const thirdCatDir = path.join(__dirname, '../gmc_data/output', country, topCat.code, secondCat.code, thirdCat.code);
  if (!fs.existsSync(thirdCatDir)) fs.mkdirSync(thirdCatDir, { recursive: true });
  const outFile = path.join(thirdCatDir, `${thirdCat.code}_${country}.csv`);

  // 先写表头
  const firstLine = fs.readFileSync(csvFileInfo.path, 'utf8').split('\n')[0];
  const header = firstLine.split(',');
  fs.writeFileSync(outFile, firstLine + '\n', 'utf8');
  const writer = fs.createWriteStream(outFile, { flags: 'a' });

  let count = 0;
  fs.createReadStream(csvFileInfo.path)
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
      if (count > 0) {
        console.log(`已生成: ${outFile} (${count} 条)`);
      }
      done();
    });
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

// 主流程：优化处理
(async function main() {
  const startTime = Date.now();
  console.log(`开始优化处理${targetCountry ? `国家 ${targetCountry}` : '所有国家'}...`);
  
  // 预加载 categories 数据（缓存优化）
  console.log('预加载 categories 数据...');
  const topCategories = getTopCategories();
  console.log(`加载了 ${topCategories.length} 个顶级类目`);
  
  for (const country of countryDirs) {
    const countryStartTime = Date.now();
    
    // 预过滤：检查哪些类目有数据
    console.log(`检查国家 ${country} 的数据...`);
    const validCategories = await checkCategoriesWithData(country);
    console.log(`国家 ${country} 发现 ${validCategories.size} 个有效类目`);
    
    // 查找二级类目目录下的CSV文件
    const countryDir = path.join(outputRoot, country);
    const csvFiles = findCsvFilesInSecondLevelDirs(countryDir);
    console.log(`国家 ${country} 找到 ${csvFiles.length} 个CSV文件（在二级类目目录中）`);
    
    for (const csvFileInfo of csvFiles) {
      const csvStartTime = Date.now();
      console.log(`处理 ${country}/${csvFileInfo.topLevel}/${csvFileInfo.secondLevel}/${csvFileInfo.filename}...`);
      
      // 处理所有三级类目
      for (const topCat of topCategories) {
        const secondCats = getSecondLevelCategories(topCat);
        for (const secondCat of secondCats) {
          const thirdCats = getThirdLevelCategories(secondCat);
          for (const thirdCat of thirdCats) {
            await new Promise((resolve) => processThirdCategory(country, csvFileInfo, topCat, secondCat, thirdCat, validCategories, resolve));
          }
        }
      }
      
      const csvDuration = ((Date.now() - csvStartTime) / 1000).toFixed(2);
      console.log(`处理 ${country}/${csvFileInfo.filename} 完成，用时: ${csvDuration} 秒`);
    }
    
    const countryDuration = ((Date.now() - countryStartTime) / 1000).toFixed(2);
    console.log(`处理国家 ${country} 完成，用时: ${countryDuration} 秒`);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`全部国家和三级类目优化处理完成，总用时: ${duration} 秒`);
})(); 