'use client';

import React from 'react';
import { Card } from './ui/card';
import { useI18n } from '@/lib/i18n/context';



export default function TrendPreview() {
  const { t } = useI18n();

  return (
    <section className="w-full py-12 flex flex-col items-center">
      <Card className="w-full max-w-2xl mx-auto p-8">
        <h2 className="text-2xl font-bold mb-4" style={{fontFamily: 'var(--font-family-heading)'}}>{t.trendPreview.title}</h2>
        <table className="w-full text-left mb-2">
          <thead>
            <tr className="text-gray-500 text-sm">
              <th>{t.trendPreview.table.rank}</th>
              <th>{t.trendPreview.table.product}</th>
              <th>{t.trendPreview.table.change}</th>
            </tr>
          </thead>
          <tbody>
            {t.trendPreview.items.map((item, i) => (
              <tr key={item.name} className="border-b last:border-0">
                <td className="py-2">{i + 1}</td>
                <td className="py-2 flex items-center gap-2">{item.name} <span>{item.icon}</span></td>
                <td className="py-2 text-green-600 font-bold">{item.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-gray-400">{t.trendPreview.note}</div>
      </Card>
    </section>
  );
} 