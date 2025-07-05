'use client';

import React from 'react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* 取消图标 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">支付已取消</h1>
          <p className="text-gray-600">您的支付过程已被取消，没有产生任何费用</p>
        </div>

        {/* 说明信息 */}
        <div className="bg-yellow-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">发生了什么？</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              您在支付过程中点击了取消按钮
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              您的账户没有被扣费
            </li>
            <li className="flex items-start">
              <span className="text-yellow-600 mr-2">•</span>
              您可以随时重新尝试支付
            </li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">接下来您可以：</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Link 
              href="/"
              className="block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新选择计划
            </Link>
            <Link 
              href="/products-explorer"
              className="block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              免费试用功能
            </Link>
          </div>
          
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 mb-4">
              如果您在支付过程中遇到问题，请联系我们的客服团队。
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                返回首页
              </Link>
              <span className="text-gray-400">|</span>
              <Link 
                href="/subscribe"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                重新订阅
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 