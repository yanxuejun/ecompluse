"use client";

import React, { useEffect, useState } from 'react';
import { countryGoogleShoppingMap } from "@/lib/country-google-shopping";
import { useI18n } from '@/lib/i18n/context';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface TaxonomyNode {
  code: number;
  catalog_name: string;
  catalog_depth: number;
  parent_catalog_code: number;
  full_catalog_name: string;
  children: TaxonomyNode[];
}

interface TaxonomyTreeProps {
  onSelect: (code: number) => void;
  selectedCode: number | null;
}

function TaxonomyTree({ onSelect, selectedCode }: TaxonomyTreeProps) {
  const { t } = useI18n();
  const [tree, setTree] = useState<TaxonomyNode[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
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
      <h2 className="font-bold mb-2">{t.productsExplorer.taxonomy.title}</h2>
      {renderTree(tree)}
    </div>
  );
}

interface QueryFiltersProps {
  filters: {
    country: string;
    minPrice: string;
    maxPrice: string;
    brandIsNull: string;
  };
  onChange: (f: any) => void;
}

function QueryFilters({ filters, onChange }: QueryFiltersProps) {
  const { t } = useI18n();
  return (
    <div className="bg-white rounded shadow p-4 flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm mb-1">{t.productsExplorer.filters.country}</label>
        <input
          className="border px-2 py-1 rounded"
          value={filters.country}
          onChange={e => onChange({ ...filters, country: e.target.value })}
          placeholder={t.productsExplorer.filters.countryPlaceholder}
        />
      </div>
      <div>
        <label className="block text-sm mb-1">{t.productsExplorer.filters.priceRange}</label>
        <div className="flex gap-2">
          <input
            className="border px-2 py-1 rounded w-20"
            type="number"
            value={filters.minPrice}
            onChange={e => onChange({ ...filters, minPrice: e.target.value })}
            placeholder={t.productsExplorer.filters.minPrice}
          />
          <span>-</span>
          <input
            className="border px-2 py-1 rounded w-20"
            type="number"
            value={filters.maxPrice}
            onChange={e => onChange({ ...filters, maxPrice: e.target.value })}
            placeholder={t.productsExplorer.filters.maxPrice}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">{t.productsExplorer.filters.brandFilter}</label>
        <select
          className="border px-2 py-1 rounded"
          value={filters.brandIsNull}
          onChange={e => onChange({ ...filters, brandIsNull: e.target.value })}
        >
          <option value="">{t.productsExplorer.filters.allBrands}</option>
          <option value="false">{t.productsExplorer.filters.withBrand}</option>
          <option value="true">{t.productsExplorer.filters.withoutBrand}</option>
        </select>
      </div>
    </div>
  );
}

interface ProductTableProps {
  category: number | null;
  filters: {
    country: string;
    minPrice: string;
    maxPrice: string;
    brandIsNull: string;
  };
}

function ProductTable({ category, filters }: ProductTableProps) {
  const { t } = useI18n();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
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

  useEffect(() => {
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
      <h2 className="font-bold mb-2">{t.productsExplorer.productTable.title}</h2>
      {loading ? (
        <div className="text-accent">{t.productsExplorer.productTable.loading}</div>
      ) : data.length === 0 ? (
        <div className="text-gray-400">{t.productsExplorer.productTable.noData}</div>
      ) : (
        <>
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-background">
              <th className="px-3 py-2 text-left">{t.productsExplorer.productTable.columns.rank}</th>
              <th className="px-3 py-2 text-left">{t.productsExplorer.productTable.columns.productTitle}</th>
              <th className="px-3 py-2 text-left">{t.productsExplorer.productTable.columns.country}</th>
              <th className="px-3 py-2 text-left">{t.productsExplorer.productTable.columns.priceRange}</th>
              <th className="px-3 py-2 text-left">{t.productsExplorer.productTable.columns.brand}</th>
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
            {t.productsExplorer.pagination.previous}
          </button>
          <span>
            {t.productsExplorer.pagination.pageInfo
              .replace('{current}', String(currentPage))
              .replace('{total}', String(totalPages))
              .replace('{count}', String(total))}
          </span>
          <button
            className="px-3 py-1 border rounded"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            {t.productsExplorer.pagination.next}
          </button>
          <select
            className="border px-2 py-1 ml-4"
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>
                {t.productsExplorer.pagination.pageSize.replace('{size}', String(size))}
              </option>
            ))}
          </select>
        </div>
        </>
      )}
    </div>
  );
}

export default function ProductsExplorerPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { t } = useI18n();
  const [selectedCode, setSelectedCode] = useState<number | null>(null);
  const [filters, setFilters] = useState<{ country: string; minPrice: string; maxPrice: string; brandIsNull: string }>({ country: '', minPrice: '', maxPrice: '', brandIsNull: '' });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 min-h-screen bg-gray-50">
      {/* 目录区 */}
      <div className="w-full md:w-1/4">
        <TaxonomyTree onSelect={setSelectedCode} selectedCode={selectedCode} />
      </div>
      {/* 右侧内容 */}
      <div className="flex-1 flex flex-col gap-6">
        <QueryFilters filters={filters} onChange={setFilters} />
        <ProductTable category={selectedCode} filters={filters} />
      </div>
    </div>
  );
} 