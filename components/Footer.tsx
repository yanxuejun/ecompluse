'use client';

import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useI18n } from '@/lib/i18n/context';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer 
      className="w-full py-12 flex flex-col items-center border-t mt-12"
      style={{ backgroundColor: 'white' }}
    >
      <h2 
        className="text-2xl font-bold mb-6" 
        style={{fontFamily: 'var(--font-family-heading)'}}
      >
        {t.footer.title}
      </h2>
      <Card className="flex flex-col md:flex-row gap-6 items-center justify-center p-8 mb-6">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{t.footer.pricing.free.name}</span>
          <span className="text-2xl" style={{fontFamily: 'var(--font-family-heading)'}}>{t.footer.pricing.free.price}</span>
        </div>
        <div className="w-px h-12 bg-gray-200 hidden md:block" />
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{t.footer.pricing.pro.name}</span>
          <span className="text-2xl" style={{fontFamily: 'var(--font-family-heading)'}}>{t.footer.pricing.pro.price}</span>
        </div>
      </Card>
      <Button 
        className="text-white font-bold px-8 py-3 text-lg"
        style={{ 
          backgroundColor: 'var(--color-accent)',
          border: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-cta)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-accent)';
        }}
      >
        {t.footer.cta}
      </Button>
    </footer>
  );
} 