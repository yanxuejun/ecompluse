'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface PaymentDetails {
  sessionId: string;
  amount: number;
  currency: string;
  planName: string;
  customerEmail: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const { user, isLoaded } = useUser();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('缺少支付会话信息');
      setLoading(false);
      return;
    }

    // 获取支付详情
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch(`/api/stripe/session-details?session_id=${sessionId}`);
        const data = await response.json();
        
        if (response.ok) {
          setPaymentDetails(data);
        } else {
          setError(data.error || '无法获取支付详情');
        }
      } catch (err) {
        setError('获取支付详情时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [searchParams]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">支付验证失败</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">验证支付中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* 成功图标 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">支付成功！</h1>
          <p className="text-gray-600">感谢您的购买，您的订单已确认</p>
        </div>

        {/* 支付详情 */}
        {paymentDetails && (
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">支付详情</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">计划名称:</span>
                <span className="font-medium">{paymentDetails.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">支付金额:</span>
                <span className="font-medium">
                  ${(paymentDetails.amount / 100).toFixed(2)} {paymentDetails.currency.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">客户邮箱:</span>
                <span className="font-medium">{paymentDetails.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">会话 ID:</span>
                <span className="font-medium text-sm">{paymentDetails.sessionId}</span>
              </div>
            </div>
          </div>
        )}

        {/* 下一步操作 */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">接下来您可以：</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link 
              href="/dashboard"
              className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              访问仪表板
            </Link>
            <Link 
              href="/products-explorer"
              className="block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              探索产品数据
            </Link>
          </div>
          
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-4">
              我们已向您的邮箱发送了确认邮件，包含详细的购买信息。
            </p>
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              返回首页
            </Link>
          </div>
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 