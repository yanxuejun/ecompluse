"use client";
import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { countryGoogleShoppingMap } from "@/lib/country-google-shopping";
import CountrySelect from "./ui/CountrySelect";
import CategoryTreeSelect from "./ui/CategoryTreeSelect";

interface TaxonomyNode {
  code: string;
  catalog_name: string;
  catalog_depth: number;
  parent_catalog_code: number | null;
  full_catalog_name: string;
  children: TaxonomyNode[];
  displayName?: string;
}

function TaxonomyTree({ onSelect, selectedCode }: { onSelect: (code: string) => void; selectedCode: string | null }) {
  const { t } = useI18n();
  const [tree, setTree] = React.useState<TaxonomyNode[]>([]);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  React.useEffect(() => {
    fetch('/categories.json')
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
            {node.displayName || node.catalog_name}
          </div>
          {node.children.length > 0 && expanded[node.code] && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="bg-white rounded shadow p-4 h-full overflow-auto">
      <h2 className="font-bold mb-2">Category Tree</h2>
      {renderTree(tree)}
    </div>
  );
}

function QueryFilters({ filters, onChange, children }: { filters: { country: string; minPrice: string; maxPrice: string; brandIsNull: string }; onChange: (f: any) => void; children?: React.ReactNode }) {
  const { language } = useI18n ? useI18n() : { language: "en" };
  return (
    <div className="bg-white rounded shadow p-4 flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm mb-1">Country</label>
        <CountrySelect
          value={filters.country}
          onChange={code => onChange({ ...filters, country: code })}
          language={language}
          placeholder="Country"
          className="w-40"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">Price Range</label>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1 rounded w-20"
            type="number"
            value={filters.minPrice}
            onChange={e => onChange({ ...filters, minPrice: e.target.value })}
            placeholder="Min Price"
          />
          <span>-</span>
          <input
            className="border px-2 py-1 rounded w-20"
            type="number"
            value={filters.maxPrice}
            onChange={e => onChange({ ...filters, maxPrice: e.target.value })}
            placeholder="Max Price"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Brand Filter</label>
        <select
          className="border px-2 py-1 rounded"
          value={filters.brandIsNull}
          onChange={e => onChange({ ...filters, brandIsNull: e.target.value })}
        >
          <option value="">All Brands</option>
          <option value="false">With Brand</option>
          <option value="true">No Brand</option>
        </select>
      </div>
      {/* 查询按钮插槽 */}
      {children && (
        <div className="w-full flex justify-end mt-2">{children}</div>
      )}
    </div>
  );
}

function ProductTable({ category, filters, hasQueried }: { category: string | null; filters: { country: string; minPrice: string; maxPrice: string; brandIsNull: string }, hasQueried: boolean }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  React.useEffect(() => {
    if (!hasQueried) return;
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
  }, [category, filters, currentPage, pageSize, hasQueried]);
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
    <div className="bg-white rounded-lg shadow p-2 md:p-6 overflow-x-auto">
      <div className="overflow-auto max-h-[500px]">
        <table className="min-w-[900px] w-full border-separate border-spacing-y-2 text-xs md:text-base">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="bg-background">
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Product Title</th>
              <th className="px-3 py-2 text-left">Country</th>
              <th className="px-3 py-2 text-left">Price Range</th>
              <th className="px-3 py-2 text-left">Brand</th>
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
      </div>
      {/* 分页控件 */}
      <div className="flex gap-2 mt-4 items-center">
        <button
          className="px-3 py-1 border rounded"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous Page
        </button>
        <span>
          Page {currentPage} / {totalPages}, Total {total} items
        </span>
        <button
          className="px-3 py-1 border rounded"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next Page
        </button>
        <select
          className="border px-2 py-1 ml-4"
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
        >
          {[10, 20, 50, 100].map(size => (
            <option key={size} value={size}>{size} items/page</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function ProductsExplorerContent({ credits, setCredits }: { credits: number|null, setCredits: (n: number|null)=>void }) {
  // 用于表单输入的临时 state
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [pendingFilters, setPendingFilters] = useState<{ country: string; minPrice: string; maxPrice: string; brandIsNull: string }>({ country: '', minPrice: '', maxPrice: '', brandIsNull: '' });
  // 实际查询用的 state
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ country: string; minPrice: string; maxPrice: string; brandIsNull: string }>({ country: '', minPrice: '', maxPrice: '', brandIsNull: '' });
  const [hasQueried, setHasQueried] = useState(false);
  
  // 查询按钮点击时应用
  const handleQuery = async () => {
    // 检查积分是否足够
    if (credits === null) {
      alert('正在加载用户信息，请稍后再试');
      return;
    }
    
    if (credits <= 0) {
      alert('积分不足！\n\n当前积分：0\n\n请升级到高级套餐获得无限积分，或等待下月积分重置。');
      return;
    }

    try {
      const res = await fetch('/api/credits/deduct', { method: 'POST' });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 400) {
          alert('积分不足！\n\n请升级到高级套餐获得无限积分，或等待下月积分重置。');
        } else {
          alert(`扣除积分失败：${data.error || '未知错误'}`);
        }
        return;
      }

      // 实时更新积分显示
      const newCredits = data.remainingCredits || (typeof credits === 'number' ? credits - 1 : credits);
      setCredits(newCredits);
      
      // 显示积分扣除成功提示
      if (newCredits > 0) {
        alert(`查询成功！\n\n已扣除1积分，剩余积分：${newCredits}`);
      } else {
        alert('查询成功！\n\n已扣除1积分，积分已用完。');
      }
      
      // 应用查询参数
      setHasQueried(true);
      setCategory(pendingCategory);
      setFilters(pendingFilters);
    } catch (error) {
      alert('网络错误，请稍后重试');
      console.error('Query error:', error);
    }
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
            Query
          </button>
        </QueryFilters>
        <ProductTable category={category} filters={filters} hasQueried={hasQueried} />
      </div>
    </div>
  );
} 