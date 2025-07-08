"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { countryGoogleShoppingMap } from "@/lib/country-google-shopping";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function ProductsPage() {
  // --- State Hooks ---
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  
  // Filter states
  const [country, setCountry] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [brandIsNull, setBrandIsNull] = useState(false);
  const [minRank, setMinRank] = useState('');
  const [maxRank, setMaxRank] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Data and UI states
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // --- Authentication Check ---
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // --- Data Fetching ---
  const handleSearch = useCallback(async (page = 1, size = 10) => {
    setLoading(true);
    const params = new URLSearchParams();
    
    // Append filter parameters
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
    
    // Append pagination parameters
    params.append('page', String(page));
    params.append('pageSize', String(size));

    try {
      const res = await fetch(`/api/sync-bigquery?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Network response was not ok');
      }
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [country, title, category, brand, start, end, brandIsNull, minRank, maxRank, minPrice, maxPrice]);
  
  // --- Event Handlers ---
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    handleSearch(1, newSize); // Reset to page 1 when page size changes
  };

  // 在 handleSearch 之前加一个 handleQueryWithCredits
  const handleQueryWithCredits = async () => {
    setLoading(true);
    const res = await fetch('/api/credits/deduct', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || '积分不足，无法查询');
      setLoading(false);
      return;
    }
    // Premium 或扣减成功
    await handleSearch(1, pageSize);
    setLoading(false);
  };

  // Render null while checking for authentication
  if (!isLoaded || !isSignedIn) {
    return (
        <div className="flex justify-center items-center h-screen">
          <span className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-accent"></span>
        </div>
    );
  }

  // --- Helper Functions ---
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
  
  // --- JSX ---
  return (
    <div className="p-2 md:p-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">BigQuery 产品数据筛选</h1>
      
      {/* Filter Inputs */}
      <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 mb-4">
        <input placeholder="国家" value={country} onChange={e => setCountry(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder="产品标题(模糊)" value={title} onChange={e => setTitle(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder="品类ID" value={category} onChange={e => setCategory(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder="品牌" value={brand} onChange={e => setBrand(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder="最小排名" type="number" value={minRank} onChange={e => setMinRank(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <input placeholder="最大排名" type="number" value={maxRank} onChange={e => setMaxRank(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <input placeholder="最低价格" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <input placeholder="最高价格" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={brandIsNull} onChange={e => setBrandIsNull(e.target.checked)} />
          只看无品牌
        </label>
        <button
          onClick={handleQueryWithCredits}
          className="bg-blue-600 text-white font-bold text-base md:text-lg px-6 py-2 md:px-8 md:py-3 rounded-lg shadow hover:bg-blue-700 transition md:w-auto"
          disabled={loading}
        >
          {loading ? '查询中...' : '查询'}
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center my-8">
          <span className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-accent mr-4"></span>
          <span className="text-accent text-lg font-bold">加载中...</span>
        </div>
      )}

      {/* Data Table and Pagination */}
      {!loading && (
        <div className="bg-white rounded-lg shadow p-2 md:p-6 overflow-x-auto">
          <table className="min-w-[900px] w-full border-separate border-spacing-y-2 text-xs md:text-base">
            <thead>
              <tr className="bg-background">
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">排名</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">国家</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">品类</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">品牌</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">产品标题</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">之前排名</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">价格范围</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">相关需求度</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">之前需求度</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">时间</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => {
                const countryCode = item.ranking_country;
                const { gl, hl } = countryGoogleShoppingMap[countryCode] || { gl: 'us', hl: 'en' };
                const productTitle = getTitle(item.product_title);
                const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productTitle)}&gl=${gl}&hl=${hl}`;

                console.log('item', item);

                return (
                  <tr key={item.rank_id || idx} className="bg-background rounded-lg shadow border-b border-gray-100">
                    <td className="px-2 md:px-3 py-1 md:py-2 font-bold text-primary">{item.rank}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.ranking_country}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.ranking_category}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.brand}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">
                      <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {productTitle}
                      </a>
                    </td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.previous_rank}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{getPriceRange(item.price_range)}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{getDemand(item.relative_demand)}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{getDemand(item.previous_relative_demand)}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.rank_timestamp?.value || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-4 mt-4 items-center">
            <div className="flex gap-2 w-full md:w-auto justify-center md:justify-start">
              <button
                className="px-3 py-1 border rounded text-xs md:text-base disabled:opacity-50"
                disabled={currentPage === 1 || loading}
                onClick={() => handleSearch(currentPage - 1, pageSize)}
              >
                上一页
              </button>
              <button
                className="px-3 py-1 border rounded text-xs md:text-base disabled:opacity-50"
                disabled={currentPage >= totalPages || loading}
                onClick={() => handleSearch(currentPage + 1, pageSize)}
              >
                下一页
              </button>
            </div>
            <span className="text-xs md:text-base">
              第 {currentPage} / {totalPages} 页 (共 {total} 条)
            </span>
            <select
              className="border px-2 py-1 w-full md:w-auto text-xs md:text-base ml-0 md:ml-auto"
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
              disabled={loading}
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size} 条/页</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}