import React, { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { countryGoogleShoppingMap } from '@/lib/country-google-shopping';
import CountrySelect from "@/components/ui/CountrySelect";
import CategoryTreeSelect from "@/components/ui/CategoryTreeSelect";

export default function TopGrowthProducts({ credits, setCredits, period = 'weekly' }: { credits: number|null, setCredits: (n: number|null)=>void, period?: 'weekly'|'monthly' }) {
  const { t, language } = useI18n();
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [noBrand, setNoBrand] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [minRank, setMinRank] = useState('');
  const [maxRank, setMaxRank] = useState('');
  // relative_demand 由范围变为字符串，去掉最小/最大需求过滤
  const [hasQueried, setHasQueried] = useState(false);
  const [productTitle, setProductTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [relDemandChange, setRelDemandChange] = useState('');

  useEffect(() => {
    if (hasQueried) {
      fetchData(currentPage, pageSize);
    }
  }, [currentPage, pageSize, hasQueried]);

  async function fetchData(page = 1, size = 20) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (country) params.append('country', country);
      if (category) params.append('category', category);
      if (brand) params.append('brand', brand);
      if (noBrand) params.append('noBrand', 'true');
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minRank) params.append('minRank', minRank);
      if (maxRank) params.append('maxRank', maxRank);
      // 已移除 relative_demand 数值范围过滤
      if (productTitle) params.append('productTitle', productTitle);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (relDemandChange) params.append('relDemandChange', relDemandChange);
      if (period) params.append('period', period);
      params.append('page', String(page));
      params.append('pageSize', String(size));
      const res = await fetch(`/api/admin/growth-products?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Query failed');
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setTotal(json.total || 0);
        setError('');
      } else {
        setError(json.error || 'Query failed');
      }
    } catch (e:any) {
      setError(e.message || 'Network error');
      setData([]);
    }
    setLoading(false);
  }

  async function handleQueryWithCredits(e: React.FormEvent) {
    e.preventDefault();
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
      setHasQueried(true);
      if (newCredits > 0) {
        alert(t.products.querySuccess + `\n\n${t.products.creditsDeducted} 1, ${t.products.currentCredits}: ${newCredits}`);
      } else {
        alert(t.products.querySuccess + `\n\n${t.products.creditsDeducted} 1, ${t.products.creditsUsedUp}`);
      }
      setCurrentPage(1);
      await fetchData(1, pageSize);
    } catch (error: any) {
      alert(error?.message || t.products.networkError);
    } finally {
      setLoading(false);
    }
  }

  // 分页和 pageSize 变化时不自动查询
  // 只有点击查询按钮后，才允许分页
  const totalPages = Math.ceil(total / pageSize) || 1;

  const getProductTitle = (row: any) => {
    if (!row.title) return '-';
    if (typeof row.title === 'string') return row.title || '-';
    return String(row.title);
  };

  return (
    <div className="p-2 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">{language==='zh'? (period==='weekly'?'热门产品按增长排名-周':'热门产品按增长排名-月') : (period==='weekly'?'Top Growth Products by Weekly':'Top Growth Products by Monthly')}</h2>
      <form className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 mb-4" onSubmit={handleQueryWithCredits}>
        <CountrySelect
          value={country}
          onChange={setCountry}
          language={language}
          placeholder={language==='zh'?'国家':'Country'}
          className="w-full md:w-auto text-sm"
        />
        <CategoryTreeSelect
          value={category}
          onChange={code => setCategory(Array.isArray(code) ? (code[0] || '') : code)}
          placeholder={language==='zh'?'类目':'Category'}
          className="w-full md:w-auto text-sm"
        />
        <input
          type="date"
          className="border px-2 py-1 w-full md:w-auto text-sm"
          placeholder={language==='zh'?'开始日期':'Start Date'}
          value={startDate}
          onChange={e=>setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="border px-2 py-1 w-full md:w-auto text-sm"
          placeholder={language==='zh'?'结束日期':'End Date'}
          value={endDate}
          onChange={e=>setEndDate(e.target.value)}
        />
        <input className="border px-2 py-1 w-full md:w-auto text-sm" placeholder={language==='zh'?'品牌':'Brand'} value={brand} onChange={e=>setBrand(e.target.value)} />
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={noBrand} onChange={e=>setNoBrand(e.target.checked)} />{language==='zh'?'只看无品牌':'Only No Brand'}</label>
        <input
          className="border px-2 py-1 w-full md:w-auto text-sm"
          placeholder={language==='zh'?'产品名称':'Product Title'}
          value={productTitle}
          onChange={e => setProductTitle(e.target.value)}
        />
        <input className="border px-2 py-1 w-full md:w-24 text-sm" placeholder={language==='zh'?'最低价':'Min Price'} value={minPrice} onChange={e=>setMinPrice(e.target.value)} />
        <input className="border px-2 py-1 w-full md:w-24 text-sm" placeholder={language==='zh'?'最高价':'Max Price'} value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} />
        <input className="border px-2 py-1 w-full md:w-20 text-sm" placeholder={language==='zh'?'最小排名':'Min Rank'} value={minRank} onChange={e=>setMinRank(e.target.value)} />
        <input className="border px-2 py-1 w-full md:w-20 text-sm" placeholder={language==='zh'?'最大排名':'Max Rank'} value={maxRank} onChange={e=>setMaxRank(e.target.value)} />
        <select 
          className="border px-2 py-1 w-full md:w-auto text-sm" 
          value={relDemandChange} 
          onChange={e=>setRelDemandChange(e.target.value)}
        >
          <option value="">{language==='zh'?'需求变化':'Rel. Demand Change'}</option>
          <option value="RISER">RISER</option>
          <option value="FLAT">FLAT</option>
          <option value="SINKER">SINKER</option>
          <option value="UNKNOWN">UNKNOWN</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white font-bold text-base md:text-lg px-6 py-2 md:px-8 md:py-3 rounded-lg shadow hover:bg-blue-700 transition md:w-auto">{language==='zh'?'查询':'Query'}</button>
      </form>
      {loading && (
        <div className="flex justify-center items-center my-8">
          <span className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-accent mr-4"></span>
          <span className="text-accent text-lg font-bold">{t.products.loading}</span>
        </div>
      )}
      {error && <div className="text-red-600 my-2">{error}</div>}
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
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">Rel. Demand Change</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{t.products.table.rankTimestamp}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const countryCode = row.country_code;
                const { gl, hl } = countryGoogleShoppingMap[countryCode] || { gl: 'us', hl: 'en' };
                const productTitle = getProductTitle(row);
                const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productTitle)}&gl=${gl}&hl=${hl}`;
                return (
                  <tr key={row.entity_id || i} className="bg-background rounded-lg shadow border-b border-gray-100">
                    <td className="px-2 md:px-3 py-1 md:py-2 font-bold text-primary">{row.rank}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.country_code}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.report_category_id}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.brand}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">
                      <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {productTitle}
                      </a>
                    </td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.previous_rank ?? ''}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.price_range}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.relative_demand}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.relative_demand_change ?? ''}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.rank_timestamp}</td>
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
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
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