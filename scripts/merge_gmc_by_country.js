const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { isMainThread, Worker } = require('worker_threads');

console.log('--- 正在运行最终性能优化版本的脚本 ---');

const dir = path.join(__dirname, '../gmc_data');
const outputDir = path.join(dir, 'output');

if (isMainThread) {
  console.log('主线程启动');
  const os = require('os');
  // 可调整参数：根据您的 CPU 核心数调整上限
  const WORKER_COUNT = Math.max(1, Math.min(os.cpus().length, 16)); 

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
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
  
  // **核心变更 1: 维护一个写入流的 Map**
  const writeStreams = new Map();

  let finishedWorkers = 0;
  const totalWorkers = fileChunks.filter(chunk => chunk.length > 0).length;
  const startTime = Date.now();

  fileChunks.forEach((chunk, i) => {
    if (chunk.length > 0) console.log(`Worker #${i + 1} 启动，分配文件数: ${chunk.length}`);
  });
  console.log('所有 worker 已启动，开始并发处理...');

  // **核心变更 2: 确保写入流被正确打开的辅助函数**
  const ensureWriteStream = (country) => {
    if (!writeStreams.has(country)) {
      const outPath = path.join(outputDir, `${country}.csv`);
      const stream = fs.createWriteStream(outPath, { encoding: 'utf8' });
      stream.write(Papa.unparse([header], { header: false }) + '\r\n'); // 先写入表头
      writeStreams.set(country, stream);
    }
    return writeStreams.get(country);
  };

  // **核心变更 3: 最终操作变为关闭所有文件流**
  const finalize = () => {
    console.log('\n所有 worker 处理完毕，正在关闭文件流...');
    const closingPromises = [];
    for (const stream of writeStreams.values()) {
      const promise = new Promise(resolve => stream.end(resolve));
      closingPromises.push(promise);
    }
    
    Promise.all(closingPromises).then(() => {
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`全部国家文件已生成并关闭。总用时: ${duration} 秒`);
    });
  };

  for (const chunk of fileChunks) {
    if (chunk.length === 0) continue;

    const worker = new Worker(path.resolve(__dirname, 'merge_gmc_worker.js'), { workerData: { dir, files: chunk } });
    
    // **核心变更 4: on 'message' 逻辑改为异步写入流**
    worker.on('message', ({ header: h, countryData: cData }) => {
      if (!header && h) header = h;
      
      for (const [country, rows] of Object.entries(cData)) {
        if (rows.length === 0) continue;

        const stream = ensureWriteStream(country); // 获取或创建文件流
        const csvChunk = Papa.unparse(rows, { header: false });
        stream.write(csvChunk + '\r\n'); // 非阻塞地写入数据
      }
    });

    worker.on('error', err => console.error('Worker 错误:', err));

    worker.on('exit', code => {
      if (code !== 0) console.error(`Worker 异常退出，退出码: ${code}`);
      
      finishedWorkers++;
      process.stdout.write(`\r进度: ${finishedWorkers}/${totalWorkers} worker 完成`);
      
      if (finishedWorkers === totalWorkers) {
        finalize();
      }
    });
  }
}