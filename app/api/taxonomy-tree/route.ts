import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET(req: NextRequest) {
  const prisma = new PrismaClient();
  const all = await prisma.google_Product_Taxonomy.findMany();
  // 构建树
  type TaxonomyNode = any & { children: TaxonomyNode[] };
  const map: Map<number, TaxonomyNode> = new Map();
  all.forEach((item: any) => map.set(item.code, { ...item, children: [] }));
  const tree: TaxonomyNode[] = [];
  all.forEach((item: any) => {
    if (item.parent_catalog_code && map.has(item.parent_catalog_code)) {
      map.get(item.parent_catalog_code)!.children.push(map.get(item.code)!);
    } else {
      tree.push(map.get(item.code)!);
    }
  });
  return NextResponse.json(tree);
} 