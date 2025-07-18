"use client";
import React, { useState, useCallback } from 'react';
import { countryGoogleShoppingMap } from "@/lib/country-google-shopping";
import { useI18n } from '@/lib/i18n/context';

export default function ProductsContent({ credits, setCredits }: { credits: number|null, setCredits: (n: number|null)=>void }) {
  const { t, language } = useI18n();
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

  // --- Data Fetching ---
  const handleSearch = useCallback(async (page = 1, size = 10) => {
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
    try {
      const res = await fetch(`/api/sync-bigquery?${params.toString()}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      setData(json.data || []);
      setTotal(json.total || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (error) {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [country, title, category, brand, start, end, brandIsNull, minRank, maxRank, minPrice, maxPrice]);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    handleSearch(1, newSize);
  };

  const handleQueryWithCredits = async () => {
    if (credits === null) {
      alert(t.products.creditsLoading);
      return;
    }
    if (credits <= 0) {
      alert(t.products.creditsNotEnough + `\n\n${t.products.currentCredits}: 0`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/credits/deduct', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400) {
          alert(t.products.creditsNotEnough);
        } else {
          alert(t.products.creditsDeductFailed + (data.error || t.products.unknownError));
        }
        setLoading(false);
        return;
      }
      const newCredits = data.remainingCredits || (typeof credits === 'number' ? credits - 1 : credits);
      setCredits(newCredits);
      if (newCredits > 0) {
        alert(t.products.querySuccess + `\n\n${t.products.creditsDeducted} 1, ${t.products.currentCredits}: ${newCredits}`);
      } else {
        alert(t.products.querySuccess + `\n\n${t.products.creditsDeducted} 1, ${t.products.creditsUsedUp}`);
      }
      await handleSearch(1, pageSize);
    } catch (error) {
      alert(t.products.networkError);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-2 md:p-8">
      <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">{t.products.title}</h1>
      <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 mb-4">
        <input placeholder={t.products.filters.country} value={country} onChange={e => setCountry(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder={t.products.filters.title} value={title} onChange={e => setTitle(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder={t.products.filters.category} value={category} onChange={e => setCategory(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder={t.products.filters.brand} value={brand} onChange={e => setBrand(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border px-2 py-1 w-full md:w-auto text-sm" />
        <input placeholder={t.products.filters.minRank} type="number" value={minRank} onChange={e => setMinRank(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <input placeholder={t.products.filters.maxRank} type="number" value={maxRank} onChange={e => setMaxRank(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <input placeholder={t.products.filters.minPrice} type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <input placeholder={t.products.filters.maxPrice} type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="border px-2 py-1 w-full md:w-24 text-sm" />
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={brandIsNull} onChange={e => setBrandIsNull(e.target.checked)} />
          {t.products.filters.onlyNoBrand}
        </label>
        <button
          onClick={handleQueryWithCredits}
          className="bg-blue-600 text-white font-bold text-base md:text-lg px-6 py-2 md:px-8 md:py-3 rounded-lg shadow hover:bg-blue-700 transition md:w-auto"
          disabled={loading}
        >
          {loading ? t.products.querying : t.products.query}
        </button>
      </div>
      {loading && (
        <div className="flex justify-center items-center my-8">
          <span className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-accent mr-4"></span>
          <span className="text-accent text-lg font-bold">{t.products.loading}</span>
        </div>
      )}
      {!loading && (
        <div className="bg-white rounded-lg shadow p-2 md:p-6 overflow-x-auto">
          <table className="min-w-[900px] w-full border-separate border-spacing-y-2 text-xs md:text-base">
            <thead>
              <tr className="bg-background">
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.rank}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.country}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.category}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.brand}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.productTitle}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.previousRank}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.priceRange}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.relativeDemand}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.previousRelativeDemand}</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.rankTimestamp}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => {
                const countryCode = item.ranking_country;
                const { gl, hl } = countryGoogleShoppingMap[countryCode] || { gl: 'us', hl: 'en' };
                const productTitle = getTitle(item.product_title);
                const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productTitle)}&gl=${gl}&hl=${hl}`;
                // 使用 rank_id 和 gtins 联合作为唯一 key
                const key = item.rank_id
                  ? `${item.rank_id}-${item.gtins?.join(',') || ''}`
                  : `${item.rank_timestamp}:${item.ranking_country}:${item.rank}:${item.ranking_category}:${productTitle}`;
                return (
                  <tr key={key} className="bg-background rounded-lg shadow border-b border-gray-100">
                    <td className="px-2 md:px-3 py-1 md:py-2 font-bold text-primary">{item.rank}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.ranking_country}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.ranking_category}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.brand}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">
                      <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {productTitle}
                      </a>
                    </td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.previous_rank ?? ''}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{getPriceRange(item.price_range)}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{getDemand(item.relative_demand)}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{getDemand(item.previous_relative_demand)}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{item.rank_timestamp?.value ? item.rank_timestamp.value.slice(0, 10) : (typeof item.rank_timestamp === 'string' ? item.rank_timestamp.slice(0, 10) : '')}</td>
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
              {t.products.prevPage}
            </button>
            <span>
              {t.products.page} {currentPage} / {totalPages}, {t.products.total} {total} {t.products.items}
            </span>
            <button
              className="px-3 py-1 border rounded"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              {t.products.nextPage}
            </button>
            <select
              className="border px-2 py-1 ml-4"
              value={pageSize}
              onChange={e => handlePageSizeChange(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size} {t.products.itemsPerPage}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
} 