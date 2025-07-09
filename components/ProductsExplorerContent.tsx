"use client";
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { countryGoogleShoppingMap } from "@/lib/country-google-shopping";

interface TaxonomyNode {
  code: number;
  catalog_name: string;
  catalog_depth: number;
  parent_catalog_code: number;
  full_catalog_name: string;
  children: TaxonomyNode[];
}

function TaxonomyTree({ onSelect, selectedCode }: { onSelect: (code: number) => void; selectedCode: number | null }) {
  const { t } = useI18n();
  const [tree, setTree] = React.useState<TaxonomyNode[]>([]);
  const [expanded, setExpanded] = React.useState<Record<number, boolean>>({});
  React.useEffect(() => {
    fetch('/api/taxonomy-tree')
      .then(res => res.json())
      .then(setTree);
  }, []);
  const renderTree = (nodes: TaxonomyNode[]): React.ReactNode => (
    <ul className="pl-4">
      {nodes.map((node) => (
        <li key={node.code}>
          <div
            className={`cursor-pointer py-1 px-2 rounded hover:bg-accent ${selectedCode === node.code ? 'bg-accent text-accent-foreground font-bold' : ''}`}
            onClick={() => onSelect(node.code)}
          >
            {node.children.length > 0 && (
              <span
                className="mr-1 cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  setExpanded(exp => ({ ...exp, [node.code]: !exp[node.code] }));
                }}
              >
                {expanded[node.code] ? '▼' : '▶'}
              </span>
            )}
            {node.catalog_name}
          </div>
          {node.children.length > 0 && expanded[node.code] && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="bg-white rounded shadow p-4 h-full overflow-auto">
      <h2 className="font-bold mb-2">目录树</h2>
      {renderTree(tree)}
    </div>
  );
}

function QueryFilters({ filters, onChange, children }: { filters: { country: string; minPrice: string; maxPrice: string; brandIsNull: string }; onChange: (f: any) => void; children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm mb-1">国家</label>
        <input
          className="border px-2 py-1 rounded"
          value={filters.country}
          onChange={e => onChange({ ...filters, country: e.target.value })}
          placeholder="国家"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">价格区间</label>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1 rounded w-20"
            type="number"
            value={filters.minPrice}
            onChange={e => onChange({ ...filters, minPrice: e.target.value })}
            placeholder="最低价"
          />
          <span>-</span>
          <input
            className="border px-2 py-1 rounded w-20"
            type="number"
            value={filters.maxPrice}
            onChange={e => onChange({ ...filters, maxPrice: e.target.value })}
            placeholder="最高价"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">品牌筛选</label>
        <select
          className="border px-2 py-1 rounded"
          value={filters.brandIsNull}
          onChange={e => onChange({ ...filters, brandIsNull: e.target.value })}
        >
          <option value="">全部品牌</option>
          <option value="false">有品牌</option>
          <option value="true">无品牌</option>
        </select>
      </div>
      {/* 查询按钮插槽 */}
      {children && (
        <div className="w-full flex justify-end mt-2">{children}</div>
      )}
    </div>
  );
}

function ProductTable({ category, filters }: { category: number | null; filters: { country: string; minPrice: string; maxPrice: string; brandIsNull: string } }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  React.useEffect(() => {
    if (!category) {
      setData([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    params.append('category', String(category));
    if (filters.country) params.append('country', filters.country);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.brandIsNull) params.append('brandIsNull', filters.brandIsNull);
    params.append('page', String(currentPage));
    params.append('pageSize', String(pageSize));
    fetch(`/api/sync-bigquery?${params.toString()}`)
      .then(res => res.json())
      .then(res => {
        setData(res.data || []);
        setTotal(res.total || 0);
      })
      .finally(() => setLoading(false));
  }, [category, filters, currentPage, pageSize]);
  React.useEffect(() => {
    setCurrentPage(1);
  }, [category, filters]);
  const getShoppingUrl = (title: string, country: string) => {
    if (!title) return '#';
    let gl = 'us', hl = 'en';
    if (country) {
      const map = countryGoogleShoppingMap[country.toUpperCase()];
      if (map) {
        gl = map.gl;
        hl = map.hl;
      }
    }
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(title)}&gl=${gl}&hl=${hl}`;
  };
  const totalPages = Math.ceil(total / pageSize) || 1;
  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="font-bold mb-2">产品表</h2>
      {loading ? (
        <div className="text-accent">加载中...</div>
      ) : data.length === 0 ? (
        <div className="text-gray-400">暂无数据</div>
      ) : (
        <>
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-background">
              <th className="px-3 py-2 text-left">排名</th>
              <th className="px-3 py-2 text-left">产品标题</th>
              <th className="px-3 py-2 text-left">国家</th>
              <th className="px-3 py-2 text-left">价格区间</th>
              <th className="px-3 py-2 text-left">品牌</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              let title = '';
              if (item.product_title && Array.isArray(item.product_title)) {
                const zh = item.product_title.find((t: any) => t.locale === 'zh-CN');
                const en = item.product_title.find((t: any) => t.locale === 'en');
                title = zh?.name || en?.name || item.product_title[0]?.name || '';
              }
              return (
                <tr key={item.rank_id || idx} className="bg-background rounded-lg shadow border-b border-gray-100">
                  <td className="px-3 py-2">{item.rank}</td>
                  <td className="px-3 py-2">
                    {title ? (
                      <a
                        href={getShoppingUrl(title, item.ranking_country)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {title}
                      </a>
                    ) : ''}
                  </td>
                  <td className="px-3 py-2">{item.ranking_country}</td>
                  <td className="px-3 py-2">{item.price_range ? `${item.price_range.min ?? ''} ~ ${item.price_range.max ?? ''} ${item.price_range.currency ?? ''}` : ''}</td>
                  <td className="px-3 py-2">{item.brand}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* 分页控件 */}
        <div className="flex gap-2 mt-4 items-center">
          <button
            className="px-3 py-1 border rounded"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            上一页
          </button>
          <span>
            第 {currentPage} / {totalPages} 页，共 {total} 条
          </span>
          <button
            className="px-3 py-1 border rounded"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            下一页
          </button>
          <select
            className="border px-2 py-1 ml-4"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}条/页</option>
            ))}
          </select>
        </div>
        </>
      )}
    </div>
  );
}

export default function ProductsExplorerContent({ credits, setCredits }: { credits: number|null, setCredits: (n: number|null)=>void }) {
  // 用于表单输入的临时 state
  const [pendingCategory, setPendingCategory] = useState<number | null>(null);
  const [pendingFilters, setPendingFilters] = useState<{ country: string; minPrice: string; maxPrice: string; brandIsNull: string }>({ country: '', minPrice: '', maxPrice: '', brandIsNull: '' });
  // 实际查询用的 state
  const [category, setCategory] = useState<number | null>(null);
  const [filters, setFilters] = useState<{ country: string; minPrice: string; maxPrice: string; brandIsNull: string }>({ country: '', minPrice: '', maxPrice: '', brandIsNull: '' });
  // 查询按钮点击时应用
  const handleQuery = async () => {
    if (credits === 0) {
      alert('请下个月再来查询或升级套餐');
      return;
    }
    const res = await fetch('/api/credits/deduct', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '积分不足，无法查询');
      return;
    }
    setCredits(typeof credits === 'number' ? credits - 1 : credits);
    setCategory(pendingCategory);
    setFilters(pendingFilters);
  };
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 min-h-screen bg-gray-50">
      {/* 目录区 */}
      <div className="w-full md:w-1/4">
        <TaxonomyTree onSelect={setPendingCategory} selectedCode={pendingCategory} />
      </div>
      {/* 右侧内容 */}
      <div className="flex-1 flex flex-col gap-6">
        <QueryFilters filters={pendingFilters} onChange={setPendingFilters}>
          <button
            className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            onClick={handleQuery}
          >
            查询
          </button>
        </QueryFilters>
        <ProductTable category={category} filters={filters} />
      </div>
    </div>
  );
} 