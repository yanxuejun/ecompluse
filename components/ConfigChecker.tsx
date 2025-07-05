'use client';

import React, { useEffect, useState } from 'react';

interface ConfigStatus {
  stripe: {
    secretKey: boolean;
    publishableKey: boolean;
  };
  clerk: {
    publishableKey: boolean;
    secretKey: boolean;
  };
  database: {
    url: boolean;
  };
}

export default function ConfigChecker() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const response = await fetch('/api/check-config');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Failed to check config:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConfig();
  }, []);

  if (loading) {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">检查配置中...</div>;
  }

  if (!config) {
    return <div className="p-4 bg-red-100 text-red-800 rounded">无法检查配置</div>;
  }

  const allConfigured = 
    config.stripe.secretKey && 
    config.clerk.publishableKey && 
    config.clerk.secretKey;

  return (
    <div className={`p-4 rounded ${allConfigured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
      <h3 className="font-bold mb-2">配置状态</h3>
      <div className="space-y-1 text-sm">
        <div className={`flex items-center ${config.stripe.secretKey ? 'text-green-600' : 'text-red-600'}`}>
          <span className="mr-2">{config.stripe.secretKey ? '✅' : '❌'}</span>
          Stripe Secret Key
        </div>
        <div className={`flex items-center ${config.clerk.publishableKey ? 'text-green-600' : 'text-red-600'}`}>
          <span className="mr-2">{config.clerk.publishableKey ? '✅' : '❌'}</span>
          Clerk Publishable Key
        </div>
        <div className={`flex items-center ${config.clerk.secretKey ? 'text-green-600' : 'text-red-600'}`}>
          <span className="mr-2">{config.clerk.secretKey ? '✅' : '❌'}</span>
          Clerk Secret Key
        </div>
        <div className={`flex items-center ${config.database.url ? 'text-green-600' : 'text-yellow-600'}`}>
          <span className="mr-2">{config.database.url ? '✅' : '⚠️'}</span>
          Database URL
        </div>
      </div>
      {!allConfigured && (
        <div className="mt-3 text-xs">
          <p>需要配置环境变量才能使用完整功能：</p>
          <ul className="list-disc list-inside mt-1">
            <li>STRIPE_SECRET_KEY - 用于支付功能</li>
            <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - 用于用户认证</li>
            <li>CLERK_SECRET_KEY - 用于用户认证</li>
          </ul>
        </div>
      )}
    </div>
  );
} 