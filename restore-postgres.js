const fs = require('fs');
const path = require('path');

console.log('🔄 恢复 PostgreSQL 数据库配置...');

// 检查备份文件
const backupPath = path.join(__dirname, '.env.backup.sqlite');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(backupPath)) {
  console.log('❌ 未找到备份文件 .env.backup.sqlite');
  console.log('请手动恢复 DATABASE_URL 配置');
  return;
}

// 恢复备份文件
fs.copyFileSync(backupPath, envPath);
console.log('✅ 已恢复 PostgreSQL 数据库配置');

console.log('\n📋 下一步操作:');
console.log('1. 检查 Prisma Cloud 数据库状态');
console.log('2. 运行: npx prisma migrate dev --name init');
console.log('3. 重启开发服务器: npm run dev'); 