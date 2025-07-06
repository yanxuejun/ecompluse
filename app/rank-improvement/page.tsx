'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface RankImprovementData {
  productTitle: string;
  currentRank: number;
  previousRank: number;
  rankImprovement: number;
  currentRelativeDemand: number;
  previousRelativeDemand: number;
  daysBetweenRankings: number;
  currentTimestamp: string;
  previousTimestamp: string;
  rankingCategory?: string;
  imageUrl?: string;
}

interface RankStats {
  total_products: number;
  rising_products: number;
  declining_products: number;
  stable_products: number;
  avg_rank_improvement: number;
  max_rank_improvement: number;
  min_rank_improvement: number;
}

function RankImprovementContent() {
  const searchParams = useSearchParams();
  const country = searchParams.get('country') || 'US';
  const categoryId = searchParams.get('categoryId') || '1';
  const urlTimestamp = searchParams.get('timestamp') || '';

  const [rankData, setRankData] = useState<RankImprovementData[]>([]);
  const [rankStats, setRankStats] = useState<RankStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [limit, setLimit] = useState(10);
  const [timestamp, setTimestamp] = useState<string>(urlTimestamp);

  // 监听URL参数变化
  useEffect(() => {
    const newUrlTimestamp = searchParams.get('timestamp') || '';
    if (newUrlTimestamp !== timestamp) {
      setTimestamp(newUrlTimestamp);
    }
  }, [searchParams, timestamp]);

  useEffect(() => {
    fetchRankImprovementData();
    fetchRankStats();
  }, [country, categoryId, limit, timestamp]);

  const fetchRankImprovementData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        country,
        categoryId,
        limit: limit.toString()
      });
      
      // 添加timestamp参数（如果存在）
      if (timestamp) {
        params.append('timestamp', timestamp);
      }

      const response = await fetch(`/api/rank-improvement?${params}`);
      const data = await response.json();

      if (data.success) {
        setRankData(data.data);
      } else {
        setError(data.error || 'Failed to fetch rank improvement data');
      }
    } catch (err) {
      setError('Error fetching rank improvement data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRankStats = async () => {
    try {
      const requestBody: any = { country, categoryId };
      if (timestamp) {
        requestBody.timestamp = timestamp;
      }

      const response = await fetch('/api/rank-improvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();

      if (data.success) {
        setRankStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching rank stats:', err);
    }
  };

  // 获取分类显示名称
  const getCategoryDisplayName = (categoryId: string) => {
    if (categoryId === '123456') {
      return '所有分类';
    }
    return `分类 ${categoryId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载排名上升分析数据中...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">🚀 排名上升分析</h1>
          <p className="text-gray-600 text-lg">
            分析产品排名改善情况，识别火箭式上升产品
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              国家: {country}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {getCategoryDisplayName(categoryId)}
            </span>
          </div>
        </div>

        {/* 排名统计 */}
        {rankStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">排名变化统计</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-md">
                <div className="text-sm text-gray-600 mb-1">总产品数</div>
                <div className="text-2xl font-bold text-gray-800">{typeof rankStats.total_products === 'number' ? rankStats.total_products : 'N/A'}</div>
              </div>
              <div className="bg-green-100 rounded-lg p-4 shadow-md">
                <div className="text-sm text-green-600 mb-1">上升产品</div>
                <div className="text-2xl font-bold text-green-800">{typeof rankStats.rising_products === 'number' ? rankStats.rising_products : 'N/A'}</div>
              </div>
              <div className="bg-red-100 rounded-lg p-4 shadow-md">
                <div className="text-sm text-red-600 mb-1">下降产品</div>
                <div className="text-2xl font-bold text-red-800">{typeof rankStats.declining_products === 'number' ? rankStats.declining_products : 'N/A'}</div>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 shadow-md">
                <div className="text-sm text-gray-600 mb-1">稳定产品</div>
                <div className="text-2xl font-bold text-gray-800">{typeof rankStats.stable_products === 'number' ? rankStats.stable_products : 'N/A'}</div>
              </div>
            </div>
            
            {rankStats.rising_products > 0 && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-sm text-gray-600 mb-1">平均排名改善</div>
                  <div className="text-xl font-bold text-green-600">
                    {typeof rankStats.avg_rank_improvement === 'number' 
                      ? rankStats.avg_rank_improvement.toFixed(1)
                      : rankStats.avg_rank_improvement || 'N/A'} 位
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-sm text-gray-600 mb-1">最大排名改善</div>
                  <div className="text-xl font-bold text-green-600">
                    {typeof rankStats.max_rank_improvement === 'number' ? rankStats.max_rank_improvement : 'N/A'} 位
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <div className="text-sm text-gray-600 mb-1">最小排名改善</div>
                  <div className="text-xl font-bold text-green-600">
                    {typeof rankStats.min_rank_improvement === 'number' ? rankStats.min_rank_improvement : 'N/A'} 位
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 显示数量设置 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            显示数量:
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={5}>前5名</option>
            <option value={10}>前10名</option>
            <option value={20}>前20名</option>
            <option value={50}>前50名</option>
          </select>
        </div>

        {/* 时间选择设置 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择时间 (可选):
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="datetime-local"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="选择特定时间"
            />
            <button
              onClick={() => setTimestamp('')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              使用最新数据
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {timestamp ? `将显示 ${timestamp} 所在周的数据` : '将显示最近一周的数据'}
          </p>
        </div>

        {/* 火箭式上升产品榜 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔥 火箭式上升产品榜</h2>
          <p className="text-gray-600 mb-6">按排名改善幅度降序排列</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rankData.map((product, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                {/* 排名改善标签 */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">#{index + 1}</span>
                    <span className="text-2xl font-bold">↑{product.rankImprovement}</span>
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    排名改善
                  </div>
                </div>

                {/* 产品信息 */}
                <div className="p-6">
                  {/* 产品图片 */}
                  {product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '' && (
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={product.imageUrl} 
                        alt={typeof product.productTitle === 'string' ? product.productTitle : 'Product'}
                        className="w-32 h-32 object-contain rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* 产品标题 */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
                    {typeof product.productTitle === 'string' ? product.productTitle : 'Unknown Product'}
                  </h3>

                  {/* 分类信息（当检索所有分类时显示） */}
                  {categoryId === '123456' && product.rankingCategory && typeof product.rankingCategory === 'string' && (
                    <div className="mb-3">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        分类: {product.rankingCategory}
                      </span>
                    </div>
                  )}

                  {/* 排名信息 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">当前排名:</span>
                      <span className="font-semibold text-gray-800">#{typeof product.currentRank === 'number' ? product.currentRank : 'N/A'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">历史排名:</span>
                      <span className="font-semibold text-gray-800">#{typeof product.previousRank === 'number' ? product.previousRank : 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">排名改善:</span>
                      <span className="font-semibold text-green-600">
                        +{typeof product.rankImprovement === 'number' ? product.rankImprovement : 'N/A'} 位
                      </span>
                    </div>
                  </div>

                  {/* 需求信息 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">相对需求:</span>
                      <span className="font-semibold text-gray-800">
                        {typeof product.currentRelativeDemand === 'number' 
                          ? product.currentRelativeDemand.toFixed(2)
                          : (typeof product.currentRelativeDemand === 'string' ? product.currentRelativeDemand : 'N/A')}
                      </span>
                    </div>
                  </div>

                  {/* 数据时间 */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">数据时间:</span>
                      <span className="font-semibold text-gray-800 text-sm">
                        {product.currentTimestamp 
                          ? new Date(product.currentTimestamp).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 空状态 */}
        {rankData.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">暂无排名上升数据</h3>
            <p className="text-gray-500">当前筛选条件下没有找到排名上升的产品</p>
          </div>
        )}

        {/* 说明信息 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📈 分析说明</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• <strong>排名改善</strong> = 历史排名 - 当前排名（正值表示上升）</li>
            <li>• 只显示排名上升的产品，按改善幅度降序排列</li>
            <li>• 数据来源：BestSellers_TopProducts_Optimized 表的 rank_improvement 字段</li>
            <li>• 基于每周数据，显示最新的排名变化情况</li>
            {categoryId === '123456' && (
              <li>• <strong>全分类模式</strong>：检索所有分类的排名上升产品</li>
            )}
          </ul>
        </div>
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

export default function RankImprovementPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RankImprovementContent />
    </Suspense>
  );
} 