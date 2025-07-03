'use client';

import React from 'react';
import { useI18n } from '@/lib/i18n/context';

export default function SocialProof() {
  const { t } = useI18n();

  return (
    <section className="w-full py-8 bg-white flex flex-col items-center">
      <span className="text-gray-500 text-sm mb-4">{t.socialProof.trustText}</span>
      <div className="flex gap-8 opacity-60">
        {t.socialProof.partners.map((partner) => (
          <div key={partner.name} className="w-24 h-10 flex items-center justify-center bg-gray-100 rounded">
            <span className="text-gray-400 font-bold">{partner.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
} 