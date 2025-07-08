'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<string>('');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetch('/api/user/init', { method: 'POST' });
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    async function fetchCredits() {
      if (isLoaded && isSignedIn) {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
          setTier(data.tier);
        }
      }
    }
    fetchCredits();
  }, [isLoaded, isSignedIn]);

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-6">
          <span className="text-lg font-bold">Credits: {tier === 'premium' ? 'Unlimited' : credits !== null ? credits : '--'}</span>
          <span className="text-lg font-bold">Plan: {tier || '--'}</span>
        </div>
        <h1 className="text-3xl font-bold mb-8" style={{fontFamily: 'var(--font-family-heading)'}}>
          仪表板
        </h1>
        {/* 显著产品相关页面链接 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <a href="/products" className="flex-1 text-center bg-white text-accent text-lg font-bold py-4 rounded-lg shadow underline hover:bg-accent/10 hover:underline hover:shadow-lg transition flex items-center justify-center gap-2">
            全数据量查询 <span className="inline-block">→</span>
          </a>
          <a href="/products-explorer" className="flex-1 text-center bg-white text-accent text-lg font-bold py-4 rounded-lg shadow underline hover:bg-accent/10 hover:underline hover:shadow-lg transition flex items-center justify-center gap-2">
            分类目热点产品 <span className="inline-block">→</span>
          </a>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 数据概览卡片 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">今日趋势</h3>
            <p className="text-3xl font-bold text-green-600">+12.5%</p>
            <p className="text-gray-600 text-sm">相比昨日</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">热门产品</h3>
            <p className="text-3xl font-bold text-blue-600">156</p>
            <p className="text-gray-600 text-sm">本周新增</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">市场机会</h3>
            <p className="text-3xl font-bold text-orange-600">23</p>
            <p className="text-gray-600 text-sm">高潜力产品</p>
          </div>
        </div>
        
        {/* 最近趋势表格 */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">最近趋势</h2>
          </div>
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">产品名称</th>
                  <th className="text-left py-2">类别</th>
                  <th className="text-left py-2">趋势</th>
                  <th className="text-left py-2">变化</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">智能手表</td>
                  <td className="py-2">电子产品</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">上升</span>
                  </td>
                  <td className="py-2 text-green-600">+15%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">无线耳机</td>
                  <td className="py-2">音频设备</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">下降</span>
                  </td>
                  <td className="py-2 text-red-600">-8%</td>
                </tr>
                <tr>
                  <td className="py-2">便携充电器</td>
                  <td className="py-2">配件</td>
                  <td className="py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">上升</span>
                  </td>
                  <td className="py-2 text-green-600">+22%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
