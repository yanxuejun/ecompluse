"use client";

import React, { useState, useEffect } from 'react';
import { countryGoogleShoppingMap } from "@/lib/country-google-shopping";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  // 所有 hooks 必须在顶层
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [country, setCountry] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [brandIsNull, setBrandIsNull] = useState(false);
  const [minRank, setMinRank] = useState('');
  const [maxRank, setMaxRank] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastFilter, setLastFilter] = useState({ country: '', title: '', category: '', brand: '', start: '', end: '', brandIsNull: false, minRank: '', maxRank: '', minPrice: '', maxPrice: '' });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  // 判断筛选条件是否变化
  const filterChanged = () => {
    return country !== lastFilter.country || title !== lastFilter.title || category !== lastFilter.category || brand !== lastFilter.brand || start !== lastFilter.start || end !== lastFilter.end || brandIsNull !== lastFilter.brandIsNull || minRank !== lastFilter.minRank || maxRank !== lastFilter.maxRank || minPrice !== lastFilter.minPrice || maxPrice !== lastFilter.maxPrice;
  };

  const handleSearch = async (page = 1, size = pageSize) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (title) params.append('title', title);
    if (category) params.append('category', category);
    if (brand) params.append('brand', brand);
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (brandIsNull) params.append('brandIsNull', 'true');
    if (minRank) params.append('minRank', minRank);
    if (maxRank) params.append('maxRank', maxRank);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    params.append('page', String(page));
    params.append('pageSize', String(size));

    const res = await fetch(`/api/sync-bigquery?${params.toString()}`);
    const json = await res.json();
    setData(json.data);
    setTotal(json.total || 0);
    setCurrentPage(page);
    setPageSize(size);
    setLoading(false);
    setLastFilter({ country, title, category, brand, start, end, brandIsNull, minRank, maxRank, minPrice, maxPrice });
  };

  // 筛选条件变化时自动重置到第一页
  useEffect(() => {
    const changed =
      country !== lastFilter.country ||
      title !== lastFilter.title ||
      category !== lastFilter.category ||
      brand !== lastFilter.brand ||
      start !== lastFilter.start ||
      end !== lastFilter.end ||
      brandIsNull !== lastFilter.brandIsNull ||
      minRank !== lastFilter.minRank ||
      maxRank !== lastFilter.maxRank ||
      minPrice !== lastFilter.minPrice ||
      maxPrice !== lastFilter.maxPrice;

    if (changed) {
      setCurrentPage(1);
      handleSearch(1, pageSize);
    }
  }, [country, title, category, brand, start, end, brandIsNull, minRank, maxRank, minPrice, maxPrice, lastFilter, pageSize]);

  // currentPage 变化时自动查询
  useEffect(() => {
    if (currentPage !== 1) {
      handleSearch(currentPage, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 解析嵌套字段
  const getTitle = (product_title: any) => {
    if (!product_title || !Array.isArray(product_title)) return '';
    const zh = product_title.find((t: any) => t.locale === 'zh-CN');
    const en = product_title.find((t: any) => t.locale === 'en');
    return (zh?.name || en?.name || product_title[0]?.name || '');
  };

  const getPriceRange = (price_range: any) => {
    if (!price_range) return '';
    return `${price_range.min ?? ''} ~ ${price_range.max ?? ''} ${price_range.currency ?? ''}`;
  };

  const getDemand = (relative_demand: any) => {
    if (!relative_demand) return '';
    return `${relative_demand.min ?? ''} ~ ${relative_demand.max ?? ''} (${relative_demand.bucket ?? ''})`;
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">BigQuery 产品数据筛选</h1>
      <div className="flex gap-4 mb-4 flex-wrap">
        <input placeholder="国家" value={country} onChange={e => setCountry(e.target.value)} className="border px-2 py-1" />
        <input placeholder="产品标题(模糊)" value={title} onChange={e => setTitle(e.target.value)} className="border px-2 py-1" />
        <input placeholder="品类ID" value={category} onChange={e => setCategory(e.target.value)} className="border px-2 py-1" />
        <input placeholder="品牌" value={brand} onChange={e => setBrand(e.target.value)} className="border px-2 py-1" />
        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border px-2 py-1" />
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border px-2 py-1" />
        <input placeholder="最小排名" type="number" value={minRank} onChange={e => setMinRank(e.target.value)} className="border px-2 py-1 w-24" />
        <input placeholder="最大排名" type="number" value={maxRank} onChange={e => setMaxRank(e.target.value)} className="border px-2 py-1 w-24" />
        <input placeholder="最低价格" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="border px-2 py-1 w-24" />
        <input placeholder="最高价格" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="border px-2 py-1 w-24" />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={brandIsNull}
            onChange={e => setBrandIsNull(e.target.checked)}
          />
          只看无品牌
        </label>
        <button
          onClick={() => handleSearch(1, pageSize)}
          className="text-white font-bold px-8 py-3 text-lg rounded transition"
          style={{ backgroundColor: 'var(--color-accent)', border: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-cta)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
        >
          查询
        </button>
        <select
          className="border px-2 py-1"
          value={pageSize}
          onChange={e => {
            const newSize = Number(e.target.value);
            setPageSize(newSize);
            handleSearch(1, newSize); // 切换每页条数时重置到第一页
          }}
        >
          {[10, 20, 50, 100].map(size => (
            <option key={size} value={size}>{size} 条/页</option>
          ))}
        </select>
      </div>
      {loading && (
        <div className="flex justify-center items-center my-8">
          <span className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-accent mr-4"></span>
          <span className="text-accent text-lg font-bold">加载中...</span>
        </div>
      )}
      <div className="bg-white rounded-lg shadow p-6">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-background">
              <th className="px-3 py-2 text-left">排名</th>
              <th className="px-3 py-2 text-left">国家</th>
              <th className="px-3 py-2 text-left">品类</th>
              <th className="px-3 py-2 text-left">品牌</th>
              <th className="px-3 py-2 text-left">产品标题</th>
              <th className="px-3 py-2 text-left">之前排名</th>
              <th className="px-3 py-2 text-left">价格范围</th>
              <th className="px-3 py-2 text-left">相关需求度</th>
              <th className="px-3 py-2 text-left">之前需求度</th>
              <th className="px-3 py-2 text-left">时间</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((item, idx) => (
              <tr key={item.rank_id || idx} className="bg-background rounded-lg shadow border-b border-gray-100">
                <td className="px-3 py-2 font-bold text-primary">{item.rank}</td>
                <td className="px-3 py-2">{item.ranking_country}</td>
                <td className="px-3 py-2">{item.ranking_category}</td>
                <td className="px-3 py-2">{item.brand}</td>
                <td className="px-3 py-2">
                  {(() => {
                    const country = item.ranking_country;
                    const { gl, hl } = countryGoogleShoppingMap[country] || { gl: 'us', hl: 'en' };
                    return (
                      <a
                        href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(getTitle(item.product_title))}&gl=${gl}&hl=${hl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {getTitle(item.product_title)}
                      </a>
                    );
                  })()}
                </td>
                <td className="px-3 py-2">{item.previous_rank}</td>
                <td className="px-3 py-2">{getPriceRange(item.price_range)}</td>
                <td className="px-3 py-2">{getDemand(item.relative_demand)}</td>
                <td className="px-3 py-2">{getDemand(item.previous_relative_demand)}</td>
                <td className="px-3 py-2">{item.rank_timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2 mt-4 items-center">
          <button
            className="px-3 py-1 border rounded"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            上一页
          </button>
          <span>
            第 {currentPage} / {totalPages} 页（共 {total} 条）
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
            onChange={e => {
              const newSize = Number(e.target.value);
              setPageSize(newSize);
              handleSearch(1, newSize);
            }}
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size} 条/页</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}