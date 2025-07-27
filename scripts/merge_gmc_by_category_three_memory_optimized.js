// merge_gmc_by_category_three_memory_optimized.js
// 用法：node merge_gmc_by_category_three_memory_optimized.js [国家代码]
// 示例：node merge_gmc_by_category_three_memory_optimized.js US
// 内存优化版本：分块处理，避免内存溢出

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

// 递归查找所有CSV文件
function findCsvFilesRecursively(dirPath) {
  const csvFiles = [];
  
  function scanDirectory(currentPath) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isFile() && item.endsWith('.csv')) {
        csvFiles.push(fullPath);
      } else if (stat.isDirectory()) {
        scanDirectory(fullPath);
      }
    }
  }
  
  scanDirectory(dirPath);
  return csvFiles;
}

// 预过滤：检查哪些类目有数据（内存优化版本）
async function checkCategoriesWithDataOptimized(country) {
  const countryDir = path.join(__dirname, '../gmc_data/output', country);
  
  if (!fs.existsSync(countryDir)) {
    console.log(`警告：国家目录 ${countryDir} 不存在`);
    return new Set();
  }
  
  // 递归查找所有CSV文件
  const csvFiles = findCsvFilesRecursively(countryDir);
  console.log(`在 ${country} 目录下找到 ${csvFiles.length} 个CSV文件`);
  
  const categorySet = new Set();
  
  for (const csvFile of csvFiles) {
    await new Promise((resolve) => {
      const stream = fs.createReadStream(csvFile);
      const parser = csv();
      
      parser.on('data', (row) => {
        if (row.ranking_category) {
          categorySet.add(row.ranking_category);
        }
      });
      
      parser.on('end', () => {
        console.log(`从 ${path.basename(csvFile)} 读取到 ${categorySet.size} 个类目`);
        resolve();
      });
      
      stream.pipe(parser);
    });
  }
  
  return categorySet;
}

// 内存优化的处理函数
function processThirdCategoryOptimized(country, csvFilePath, topCat, secondCat, thirdCat, validCategories, done) {
  const countryDir = path.join(__dirname, '../gmc_data/output', country);
  
  // 检查该类目是否有数据
  const allCodes = new Set(collectAllCodes(thirdCat));
  const hasData = Array.from(allCodes).some(code => validCategories.has(code));
  
  if (!hasData) {
    done(); // 跳过没有数据的类目
    return;
  }
  
  const thirdCatDir = path.join(countryDir, topCat.code, secondCat.code, thirdCat.code);
  if (!fs.existsSync(thirdCatDir)) fs.mkdirSync(thirdCatDir, { recursive: true });
  const outFile = path.join(thirdCatDir, `${thirdCat.code}_${country}.csv`);

  // 先写表头
  const firstLine = fs.readFileSync(csvFilePath, 'utf8').split('\n')[0];
  const header = firstLine.split(',');
  fs.writeFileSync(outFile, firstLine + '\n', 'utf8');
  const writer = fs.createWriteStream(outFile, { flags: 'a' });

  let count = 0;
  let processedRows = 0;
  
  // 使用流式处理，避免内存溢出
  const stream = fs.createReadStream(csvFilePath);
  const parser = csv();
  
  parser.on('data', (row) => {
    processedRows++;
    
    // 每处理1000行输出一次进度
    if (processedRows % 1000 === 0) {
      process.stdout.write(`\r处理中... ${processedRows} 行`);
    }
    
    if (allCodes.has(row.ranking_category)) {
      const csvLine = Papa.unparse([row], { header: false, columns: header }) + '\n';
      writer.write(csvLine);
      count++;
    }
  });
  
  parser.on('end', () => {
    writer.end();
    process.stdout.write('\n'); // 清除进度显示
    if (count > 0) {
      console.log(`已生成: ${outFile} (${count} 条)`);
    }
    done();
  });
  
  stream.pipe(parser);
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

// 主流程：内存优化处理
(async function main() {
  const startTime = Date.now();
  console.log(`开始内存优化处理${targetCountry ? `国家 ${targetCountry}` : '所有国家'}...`);
  console.log(`找到 ${countryDirs.length} 个国家目录: ${countryDirs.join(', ')}`);
  
  // 预加载 categories 数据（缓存优化）
  console.log('预加载 categories 数据...');
  const topCategories = getTopCategories();
  console.log(`加载了 ${topCategories.length} 个顶级类目`);
  
  for (const country of countryDirs) {
    const countryStartTime = Date.now();
    
    // 预过滤：检查哪些类目有数据
    console.log(`检查国家 ${country} 的数据...`);
    const validCategories = await checkCategoriesWithDataOptimized(country);
    console.log(`国家 ${country} 发现 ${validCategories.size} 个有效类目`);
    
    const countryDir = path.join(outputRoot, country);
    
    // 递归获取所有CSV文件
    const csvFiles = findCsvFilesRecursively(countryDir);
    console.log(`国家 ${country} 找到 ${csvFiles.length} 个CSV文件`);
    
    for (const csvFile of csvFiles) {
      const csvStartTime = Date.now();
      console.log(`处理 ${country}/${path.basename(csvFile)}...`);
      
      // 串行处理，避免内存问题
      for (const topCat of topCategories) {
        const secondCats = getSecondLevelCategories(topCat);
        for (const secondCat of secondCats) {
          const thirdCats = getThirdLevelCategories(secondCat);
          for (const thirdCat of thirdCats) {
            await new Promise((resolve) => {
              processThirdCategoryOptimized(country, csvFile, topCat, secondCat, thirdCat, validCategories, resolve);
            });
          }
        }
      }
      
      const csvDuration = ((Date.now() - csvStartTime) / 1000).toFixed(2);
      console.log(`处理 ${country}/${path.basename(csvFile)} 完成，用时: ${csvDuration} 秒`);
    }
    
    const countryDuration = ((Date.now() - countryStartTime) / 1000).toFixed(2);
    console.log(`处理国家 ${country} 完成，用时: ${countryDuration} 秒`);
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`全部国家和三级类目内存优化处理完成，总用时: ${duration} 秒`);
})(); 