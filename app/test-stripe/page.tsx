'use client';

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function TestStripePage() {
  const { isSignedIn, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testStripeCheckout = async (tier: string) => {
    setLoading(true);
    setResult('');
    
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.url) {
        setResult(`✅ 成功创建支付会话: ${data.url}`);
        // 可以选择是否自动跳转
        // window.location.href = data.url;
      } else {
        setResult(`❌ 错误: ${data.error || '未知错误'}`);
      }
    } catch (error) {
      setResult(`❌ 网络错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">加载中...</div>;
  }

  if (!isSignedIn) {
    return <div className="p-8">请先登录</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Stripe 集成测试</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Starter Plan</h3>
          <p className="text-2xl font-bold mb-4">$199</p>
          <button
            onClick={() => testStripeCheckout('starter')}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试 Starter'}
          </button>
        </div>
        
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Standard Plan</h3>
          <p className="text-2xl font-bold mb-4">$249</p>
          <button
            onClick={() => testStripeCheckout('standard')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试 Standard'}
          </button>
        </div>
        
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Premium Plan</h3>
          <p className="text-2xl font-bold mb-4">$299</p>
          <button
            onClick={() => testStripeCheckout('premium')}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? '测试中...' : '测试 Premium'}
          </button>
        </div>
      </div>
      
      {result && (
        <div className={`p-4 rounded-lg ${
          result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <h3 className="font-semibold mb-2">测试结果:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">说明:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>此页面用于测试 Stripe 支付集成</li>
          <li>点击按钮会创建支付会话，但不会自动跳转</li>
          <li>如果看到支付 URL，说明集成成功</li>
          <li>如果看到错误信息，请检查环境变量配置</li>
        </ul>
      </div>
    </div>
  );
} 