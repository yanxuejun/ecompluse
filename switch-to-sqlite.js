const fs = require('fs');
const path = require('path');

console.log('🔄 切换到本地 SQLite 数据库...');

// 备份当前的 .env 文件
const envPath = path.join(__dirname, '.env');
const backupPath = path.join(__dirname, '.env.backup.sqlite');

if (fs.existsSync(envPath)) {
  fs.copyFileSync(envPath, backupPath);
  console.log('✅ 已备份当前 .env 文件到 .env.backup.sqlite');
}

// 读取当前 .env 文件
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// 替换 DATABASE_URL 为 SQLite
const sqliteUrl = 'DATABASE_URL="file:./dev.db"';
const newEnvContent = envContent.replace(
  /DATABASE_URL="[^"]*"/,
  sqliteUrl
);

// 写入新的 .env 文件
fs.writeFileSync(envPath, newEnvContent);
console.log('✅ 已更新 DATABASE_URL 为 SQLite');

console.log('\n📋 下一步操作:');
console.log('1. 运行: npx prisma migrate reset');
console.log('2. 运行: npx prisma generate');
console.log('3. 运行: npx prisma migrate dev --name init');
console.log('4. 重启开发服务器: npm run dev');

console.log('\n💡 如果要恢复 PostgreSQL 数据库:');
console.log('   - 运行: node restore-postgres.js'); 