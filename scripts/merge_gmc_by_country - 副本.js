const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { isMainThread, Worker } = require('worker_threads');

console.log('--- 正在运行最终内存优化版本的脚本 ---'); 

const dir = path.join(__dirname, '../gmc_data');
const outputDir = path.join(dir, 'output');

if (isMainThread) {
  console.log('主线程启动');
  const os = require('os');
  const WORKER_COUNT = Math.max(1, Math.min(os.cpus().length, 8));

  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir);
    } catch (err) {
      console.error('创建输出目录失败:', err);
      process.exit(1);
    }
  }

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.csv') && !f.startsWith('output/'));
  
  if (files.length === 0) {
    console.log('没有找到需要处理的 .csv 文件。');
    process.exit(0);
  }

  console.log(`待处理文件总数: ${files.length}`);
  console.log(`将使用 worker 数量: ${WORKER_COUNT}`);

  const chunkSize = Math.ceil(files.length / WORKER_COUNT);
  const fileChunks = Array.from({ length: WORKER_COUNT }, (_, i) => files.slice(i * chunkSize, (i + 1) * chunkSize));

  let header = null;
  // **核心变更 1: 不再需要巨大的 countryData 对象**
  // const countryData = {};
  
  // **核心变更 2: 新增一个集合，用于跟踪已写入表头的国家文件**
  const writtenHeaders = new Set();
  
  let finishedWorkers = 0;
  const totalWorkers = fileChunks.filter(chunk => chunk.length > 0).length;
  const startTime = Date.now();

  fileChunks.forEach((chunk, i) => {
    if (chunk.length > 0) console.log(`Worker #${i + 1} 启动，分配文件数: ${chunk.length}`);
  });
  console.log('所有 worker 已启动，开始并发处理...');

  // **核心变更 3: 简化 finalize 函数，只负责打印结束日志**
  const finalize = () => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n全部国家文件已生成。总用时: ${duration} 秒`);
  };

  for (const chunk of fileChunks) {
    if (chunk.length === 0) continue;

    const worker = new Worker(path.resolve(__dirname, 'merge_gmc_worker.js'), { workerData: { dir, files: chunk } });
    
    // **核心变更 4: 重写 on 'message' 逻辑，进行流式写入**
    worker.on('message', ({ header: h, countryData: cData }) => {
      if (!header && h) header = h;
      
      for (const [country, rows] of Object.entries(cData)) {
        if (rows.length === 0) continue;

        // 新增：确保国家目录存在
        const countryDir = path.join(outputDir, country);
        if (!fs.existsSync(countryDir)) {
          fs.mkdirSync(countryDir, { recursive: true });
        }
        const outPath = path.join(countryDir, `${country}.csv`);
        try {
          if (!writtenHeaders.has(country)) {
            // 如果这个国家的文件是第一次写入，则包含表头
            const csv = Papa.unparse(rows, { header: true, columns: header });
            fs.writeFileSync(outPath, csv, 'utf8');
            writtenHeaders.add(country);
          } else {
            // 如果文件已存在，则不含表头，并且在前面加一个换行符，进行追加
            const csvChunk = Papa.unparse(rows, { header: false });
            fs.appendFileSync(outPath, '\r\n' + csvChunk, 'utf8');
          }
        } catch(err) {
            console.error(`写入文件 ${outPath} 时出错:`, err);
        }
      }
    });

    worker.on('error', err => {
      console.error('Worker 错误:', err);
    });

    worker.on('exit', code => {
      if (code !== 0) console.error(`Worker 异常退出，退出码: ${code}`);
      
      finishedWorkers++;
      process.stdout.write(`\r进度: ${finishedWorkers}/${totalWorkers} worker 完成`); // 使用 process.stdout.write 实现单行刷新进度条
      
      if (finishedWorkers === totalWorkers) {
        finalize();
      }
    });
  }
}