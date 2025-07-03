'use client';

import React from 'react';
import { Button } from './ui/button';
import { useI18n } from '@/lib/i18n/context';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function Navbar() {
  const { t, language, setLanguage } = useI18n();
  const { isSignedIn, user } = useUser();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <nav 
      className="w-full px-6 py-3 flex items-center justify-between shadow"
      style={{ 
        backgroundColor: 'var(--color-primary)', 
        color: 'white' 
      }}
    >
      <div className="flex items-center gap-8">
        <span className="text-2xl font-bold tracking-tight" style={{fontFamily: 'var(--font-family-heading)'}}>{t.navbar.logo}</span>
        <a href="#" className="hover:underline">{t.navbar.trends}</a>
        <a href="#" className="hover:underline">{t.navbar.rankings}</a>
        <a href="#" className="hover:underline">{t.navbar.pricing}</a>
        {isSignedIn && (
          <Link href="/dashboard" className="hover:underline">仪表板</Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleLanguage}
          className="text-sm hover:underline"
        >
          {language === 'zh' ? 'EN' : '中文'}
        </button>
        
        {isSignedIn ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">欢迎, {user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/10"
              >
                {t.navbar.login}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button 
                className="text-white font-bold px-4 py-2 rounded transition"
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
                {t.navbar.register}
              </Button>
            </SignUpButton>
          </div>
        )}
      </div>
    </nav>
  );
} 