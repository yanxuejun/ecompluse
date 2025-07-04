'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';

export default function DataStats() {
  const { t } = useI18n();

  const stats = [
    {
      icon: '🌍',
      color: 'bg-blue-100',
      textColor: 'text-blue-600',
      data: t.dataStats.countries
    },
    {
      icon: '📂',
      color: 'bg-green-100',
      textColor: 'text-green-600',
      data: t.dataStats.categories
    },
    {
      icon: '📊',
      color: 'bg-purple-100',
      textColor: 'text-purple-600',
      data: t.dataStats.products
    },
    {
      icon: '🏷️',
      color: 'bg-orange-100',
      textColor: 'text-orange-600',
      data: t.dataStats.brands
    }
  ];

  return (
    <section className="w-full py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          {/* 详细统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-3xl">{stat.icon}</span>
                </div>
                <div className={`text-4xl md:text-5xl font-bold ${stat.textColor} mb-2`}>
                  {stat.data.value}
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  {stat.data.title}
                </div>
                <div className="text-sm text-gray-500">
                  {stat.data.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 