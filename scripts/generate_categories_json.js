const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvPath = path.join(process.cwd(), 'google_taxonomy_parsed.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

const nodeMap = {};
records.forEach(row => {
  nodeMap[row.code] = { ...row, children: [] };
});

const tree = [];
records.forEach(row => {
  const node = nodeMap[row.code];
  if (row.parent_catalog_code && row.parent_catalog_code !== '0') {
    if (nodeMap[row.parent_catalog_code]) {
      nodeMap[row.parent_catalog_code].children.push(node);
    }
  } else {
    tree.push(node);
  }
});

const outPath = path.join(process.cwd(), 'public', 'categories.json');
fs.writeFileSync(outPath, JSON.stringify(tree, null, 2), 'utf-8');
console.log('categories.json generated:', outPath); 