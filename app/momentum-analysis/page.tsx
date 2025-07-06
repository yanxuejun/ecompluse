'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface MomentumData {
  productTitle: string;
  currentRank: number;
  previousRank: number | null;
  rankImprovement: number | null;
  currentRelativeDemand: number;
  previousRelativeDemand: number | null;
  demandChange: number | null;
  momentumScore: number;
  trendType: string;
  imageUrl: string | null;
  searchTitle: string | null;
  searchLink: string | null;
  analysisTimestamp: string;
}

interface TrendStats {
  trend_type: string;
  count: number;
  avg_momentum_score: number;
  avg_rank_change: number;
  avg_demand_change: number;
}

function MomentumAnalysisContent() {
  const searchParams = useSearchParams();
  const [momentumData, setMomentumData] = useState<MomentumData[]>([]);
  const [trendStats, setTrendStats] = useState<TrendStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedTrendType, setSelectedTrendType] = useState<string>('');

  const country = searchParams.get('country') || 'US';
  const categoryId = searchParams.get('categoryId') || '1';

  useEffect(() => {
    fetchMomentumData();
    fetchTrendStats();
  }, [country, categoryId, selectedTrendType]);

  const fetchMomentumData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        country,
        categoryId,
        limit: '20'
      });
      
      if (selectedTrendType) {
        params.append('trendType', selectedTrendType);
      }

      const response = await fetch(`/api/momentum-analysis?${params}`);
      const data = await response.json();

      if (data.success) {
        setMomentumData(data.data);
      } else {
        setError(data.error || 'Failed to fetch momentum data');
      }
    } catch (err) {
      setError('Error fetching momentum data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendStats = async () => {
    try {
      const response = await fetch('/api/momentum-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, categoryId })
      });
      const data = await response.json();

      if (data.success) {
        setTrendStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching trend stats:', err);
    }
  };

  const getTrendTypeLabel = (trendType: string) => {
    const labels: { [key: string]: string } = {
      'ROCKET_RISING': '🚀 火箭式上升',
      'RANK_IMPROVING': '📈 排名改善',
      'DEMAND_INCREASING': '🔥 需求增长',
      'DECLINING': '📉 下降趋势',
      'STABLE_GROWING': '📊 稳定增长',
      'STABLE_DECLINING': '📊 稳定下降',
      'STABLE': '➡️ 稳定',
      'NEW_PRODUCT': '🆕 新产品'
    };
    return labels[trendType] || trendType;
  };

  const getTrendColor = (trendType: string) => {
    const colors: { [key: string]: string } = {
      'ROCKET_RISING': 'bg-gradient-to-r from-green-500 to-emerald-500',
      'RANK_IMPROVING': 'bg-gradient-to-r from-blue-500 to-cyan-500',
      'DEMAND_INCREASING': 'bg-gradient-to-r from-orange-500 to-red-500',
      'DECLINING': 'bg-gradient-to-r from-gray-500 to-slate-500',
      'STABLE_GROWING': 'bg-gradient-to-r from-teal-500 to-green-500',
      'STABLE_DECLINING': 'bg-gradient-to-r from-yellow-500 to-orange-500',
      'STABLE': 'bg-gradient-to-r from-gray-400 to-gray-500',
      'NEW_PRODUCT': 'bg-gradient-to-r from-purple-500 to-pink-500'
    };
    return colors[trendType] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载趋势分析数据中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">加载失败</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">趋势强度分析</h1>
          <p className="text-gray-600 text-lg">
            分析产品排名变化和需求趋势，识别市场热点
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              国家: {country}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              分类: {categoryId}
            </span>
          </div>
        </div>

        {/* 趋势统计 */}
        {trendStats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">趋势分布统计</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trendStats.map((stat) => (
                <div key={stat.trend_type} className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-sm text-gray-600 mb-1">
                    {getTrendTypeLabel(stat.trend_type)}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">{stat.count}</div>
                  <div className="text-xs text-gray-500">
                    平均动量: {stat.avg_momentum_score?.toFixed(2) || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 趋势类型筛选 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            筛选趋势类型:
          </label>
          <select
            value={selectedTrendType}
            onChange={(e) => setSelectedTrendType(e.target.value)}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部趋势</option>
            <option value="ROCKET_RISING">🚀 火箭式上升</option>
            <option value="RANK_IMPROVING">📈 排名改善</option>
            <option value="DEMAND_INCREASING">🔥 需求增长</option>
            <option value="DECLINING">📉 下降趋势</option>
            <option value="STABLE_GROWING">📊 稳定增长</option>
            <option value="STABLE_DECLINING">📊 稳定下降</option>
            <option value="STABLE">➡️ 稳定</option>
            <option value="NEW_PRODUCT">🆕 新产品</option>
          </select>
        </div>

        {/* 产品列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {momentumData.map((product, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* 产品图片 */}
              {product.imageUrl && (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={product.imageUrl}
                    alt={product.productTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* 产品信息 */}
              <div className="p-6">
                {/* 趋势标签 */}
                <div className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium mb-3 ${getTrendColor(product.trendType)}`}>
                  {getTrendTypeLabel(product.trendType)}
                </div>

                {/* 产品标题 */}
                <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                  {product.productTitle}
                </h3>

                {/* 排名信息 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">当前排名:</span>
                    <span className="font-semibold text-gray-800">#{product.currentRank}</span>
                  </div>
                  
                  {product.previousRank && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">历史排名:</span>
                      <span className="font-semibold text-gray-800">#{product.previousRank}</span>
                    </div>
                  )}

                  {product.rankImprovement !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">排名改善:</span>
                      <span className={`font-semibold ${product.rankImprovement > 0 ? 'text-green-600' : product.rankImprovement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {product.rankImprovement > 0 ? '+' : ''}{product.rankImprovement}
                      </span>
                    </div>
                  )}
                </div>

                {/* 需求信息 */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">当前需求:</span>
                    <span className="font-semibold text-gray-800">{product.currentRelativeDemand?.toFixed(2)}</span>
                  </div>
                  
                  {product.demandChange !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">需求变化:</span>
                      <span className={`font-semibold ${product.demandChange > 0 ? 'text-green-600' : product.demandChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {product.demandChange > 0 ? '+' : ''}{product.demandChange?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 动量分数 */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">动量分数:</span>
                    <span className="font-bold text-lg text-blue-600">
                      {product.momentumScore?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 搜索链接 */}
                {product.searchLink && (
                  <div className="mt-4">
                    <a
                      href={product.searchLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      查看详情 →
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {momentumData.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无趋势数据</h3>
            <p className="text-gray-500">当前筛选条件下没有找到趋势分析数据</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

export default function MomentumAnalysisPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MomentumAnalysisContent />
    </Suspense>
  );
} 