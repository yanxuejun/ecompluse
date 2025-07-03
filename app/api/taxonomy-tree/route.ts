import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(req: NextRequest) {
  const prisma = new PrismaClient();
  const all = await prisma.google_Product_Taxonomy.findMany();
  // 构建树
  const map = new Map();
  all.forEach(item => map.set(item.code, { ...item, children: [] }));
  const tree = [];
  all.forEach(item => {
    if (item.parent_catalog_code && map.has(item.parent_catalog_code)) {
      map.get(item.parent_catalog_code).children.push(map.get(item.code));
    } else {
      tree.push(map.get(item.code));
    }
  });
  return NextResponse.json(tree);
} 