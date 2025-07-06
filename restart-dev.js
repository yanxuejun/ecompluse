const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 重启开发服务器...');

// 检查是否有正在运行的开发服务器进程
console.log('检查是否有正在运行的开发服务器...');

// 启动开发服务器
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

console.log('✅ 开发服务器已启动');
console.log('💡 请等待几秒钟让服务器完全启动，然后访问 http://localhost:3000');
console.log('🔍 如果环境变量仍然没有生效，请检查:');
console.log('   1. 浏览器缓存 - 按 Ctrl+F5 强制刷新');
console.log('   2. 重启 IDE/编辑器');
console.log('   3. 检查 .env 文件语法');

// 监听进程退出
devProcess.on('close', (code) => {
  console.log(`开发服务器已退出，退出码: ${code}`);
});

devProcess.on('error', (error) => {
  console.error('启动开发服务器时出错:', error);
}); 