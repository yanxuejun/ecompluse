'use client';

import React from 'react';
import { Card } from './ui/card';
import { useI18n } from '@/lib/i18n/context';

export default function Features() {
  const { t } = useI18n();

  return (
    <section className="w-full py-12 bg-background flex flex-col items-center">
      <div className="flex flex-col md:flex-row gap-8 justify-center">
        {t.features.items.map((feature) => (
          <Card key={feature.title} className="flex flex-col items-center p-8 w-80">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold mb-2" style={{fontFamily: 'var(--font-family-heading)'}}>{feature.title}</h3>
            <p className="text-gray-600 text-center">{feature.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
} 