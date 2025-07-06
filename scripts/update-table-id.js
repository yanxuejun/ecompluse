const fs = require('fs');
const path = require('path');

// 更新 .env 文件中的表 ID
function updateTableId() {
  const envPath = path.join(__dirname, '..', '.env');
  const content = fs.readFileSync(envPath, 'utf8');
  
  // 替换表 ID
  const updatedContent = content.replace(
      /BIGQUERY_TABLE_ID=.*/,
  'BIGQUERY_TABLE_ID=BestSellers_TopProducts_Optimized'
  );
  
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('✅ 已更新表 ID 为: BestSellers_TopProducts_Optimized');
  console.log('');
  console.log('现在可以重新运行产品排名更新脚本了！');
}

updateTableId(); 