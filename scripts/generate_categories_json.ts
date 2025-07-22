import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface CategoryNode {
  code: string;
  catalog_name: string;
  catalog_depth: number;
  parent_catalog_code: string;
  full_catalog_name: string;
  children?: CategoryNode[];
}

const csvPath = path.join(process.cwd(), 'google_taxonomy_parsed.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
});

const nodeMap: Record<string, CategoryNode> = {};
records.forEach((row: any) => {
  nodeMap[row.code] = { ...row, children: [] };
});

const tree: CategoryNode[] = [];
records.forEach((row: any) => {
  const node = nodeMap[row.code];
  if (row.parent_catalog_code && row.parent_catalog_code !== '0') {
    nodeMap[row.parent_catalog_code]?.children?.push(node);
  } else {
    tree.push(node);
  }
});

const outPath = path.join(process.cwd(), 'public', 'categories.json');
fs.writeFileSync(outPath, JSON.stringify(tree, null, 2), 'utf-8');
console.log('categories.json generated:', outPath); 