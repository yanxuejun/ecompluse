const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { parentPort, workerData } = require('worker_threads');

const { dir, files } = workerData;
let header = null;
const countryData = {};
for (const file of files) {
  const filePath = path.join(dir, file);
  let csv;
  try {
    csv = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    parentPort.postMessage({ error: `读取文件失败: ${filePath}` });
    continue;
  }
  let parsed;
  try {
    parsed = Papa.parse(csv, { header: true });
  } catch (err) {
    parentPort.postMessage({ error: `解析CSV失败: ${filePath}` });
    continue;
  }
  if (!header && parsed.meta && parsed.meta.fields) {
    header = parsed.meta.fields;
  }
  for (const row of parsed.data) {
    if (!row || typeof row !== 'object') continue;
    const country = row.ranking_country;
    if (!country) continue;
    if (!countryData[country]) countryData[country] = [];
    countryData[country].push(row);
  }
}
parentPort.postMessage({ header, countryData }); 