const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 清除 Next.js 缓存...');

// 删除 .next 目录
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  console.log('删除 .next 目录...');
  fs.rmSync(nextDir, { recursive: true, force: true });
}

// 删除 node_modules/.cache 目录
const cacheDir = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  console.log('删除 node_modules/.cache 目录...');
  fs.rmSync(cacheDir, { recursive: true, force: true });
}

// 重新安装依赖（可选）
console.log('重新安装依赖...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.log('npm install 失败，跳过...');
}

console.log('✅ 缓存清除完成！');
console.log('现在请重新启动开发服务器：npm run dev'); 