import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useI18n } from '@/lib/i18n/context';
import { countryGoogleShoppingMap } from '@/lib/country-google-shopping';

export default function ProductFavorites() {
  const { user } = useUser();
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
  }, [user?.id, currentPage, pageSize]);

  async function fetchFavorites() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('pageSize', String(pageSize));
      
      const res = await fetch(`/api/favorites?${params.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch favorites');
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
        setTotal(json.total || 0);
        setError('');
      } else {
        setError(json.error || 'Failed to fetch favorites');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
      setData([]);
    }
    setLoading(false);
  }

  async function removeFavorite(id: number) {
    if (!window.confirm(language === 'zh' ? '确定要删除这个收藏吗？' : 'Are you sure you want to remove this favorite?')) {
      return;
    }

    try {
      const res = await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to remove favorite');
      }
      const json = await res.json();
      if (json.success) {
        // Refresh the list
        await fetchFavorites();
        alert(language === 'zh' ? '收藏已删除' : 'Favorite removed successfully');
      } else {
        alert(json.error || (language === 'zh' ? '删除失败' : 'Failed to remove favorite'));
      }
    } catch (e: any) {
      alert(e.message || (language === 'zh' ? '网络错误' : 'Network error'));
    }
  }

  const getProductTitle = (row: any) => {
    if (!row.title) return '-';
    if (typeof row.title === 'string') return row.title || '-';
    return String(row.title);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="p-2 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">
        {language === 'zh' ? '产品收藏' : 'Product Favorites'}
      </h2>
      
      {loading && (
        <div className="flex justify-center items-center my-8">
          <span className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-accent mr-4"></span>
          <span className="text-accent text-lg font-bold">{t.products.loading}</span>
        </div>
      )}
      
      {error && <div className="text-red-600 my-2">{error}</div>}
      
      {!loading && data.length === 0 && !error && (
        <div className="text-center py-8 text-gray-500">
          {language === 'zh' ? '暂无收藏的产品' : 'No favorite products yet'}
        </div>
      )}
      
      {!loading && data.length > 0 && (
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
                <th className="px-2 md:px-3 py-1 md:py-2 text-left">{language === 'zh' ? '操作' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const countryCode = row.country_code;
                const { gl, hl } = countryGoogleShoppingMap[countryCode] || { gl: 'us', hl: 'en' };
                const productTitle = getProductTitle(row);
                const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productTitle)}&gl=${gl}&hl=${hl}`;
                return (
                  <tr key={row.id || i} className="bg-background rounded-lg shadow border-b border-gray-100">
                    <td className="px-2 md:px-3 py-1 md:py-2 font-bold text-primary">{row.rank}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.country_code}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{row.categroy_id}</td>
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
                    <td className="px-2 md:px-3 py-1 md:py-2">
                      <button
                        onClick={() => removeFavorite(row.id)}
                        className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition"
                      >
                        {language === 'zh' ? '删除' : 'Remove'}
                      </button>
                    </td>
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
