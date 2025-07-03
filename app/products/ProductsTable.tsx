"use client";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/table";
import React, { useState } from "react";

export default function ProductsTable({ products, categories }: { products: any[]; categories: string[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const filtered = selectedCategory ? products.filter(p => p.category === selectedCategory) : products;

  const getTitle = (product_title: any) => {
    if (!product_title || !Array.isArray(product_title)) return '';
    const zh = product_title.find((t: any) => t.locale === 'zh-CN');
    const en = product_title.find((t: any) => t.locale === 'en');
    return (zh?.name || en?.name || product_title[0]?.name || '');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">产品趋势列表</h1>
      <div className="mb-4">
        <label className="mr-2">按类别筛选：</label>
        <select
          className="border rounded px-2 py-1"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          <option value="">全部</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名称</TableHead>
            <TableHead>类别</TableHead>
            <TableHead>相对需求</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(product => (
            <TableRow key={product.id}>
              <TableCell>
                <a
                  href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(getTitle(product.product_title))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {getTitle(product.product_title)}
                </a>
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>{product.relativeDemand}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 