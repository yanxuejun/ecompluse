'use client';

import React from 'react';
import { Card } from './ui/card';
import { useI18n } from '@/lib/i18n/context';

export default function Features() {
  const { t } = useI18n();

  return (
    <section className="w-full py-8 md:py-12 bg-background flex flex-col items-center">
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 justify-center w-full px-2 md:px-0">
        {t.features.items.map((feature) => (
          <Card key={feature.title} className="flex flex-col items-center p-4 md:p-8 w-full max-w-xs">
            <div className="text-2xl md:text-4xl mb-2 md:mb-4">{feature.icon}</div>
            <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2" style={{fontFamily: 'var(--font-family-heading)'}}>{feature.title}</h3>
            <p className="text-gray-600 text-center text-sm md:text-base">{feature.description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
} 