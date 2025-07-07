'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer 
      className="w-full py-6 flex flex-col items-center border-t mt-12 text-gray-400 text-sm bg-white"
    >
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-4">
          <Link 
            href="/privacy-policy" 
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 underline"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-300">|</span>
          <Link 
            href="/terms-of-service" 
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200 underline"
          >
            Terms of Service
          </Link>
        </div>
        <div className="text-gray-400">
          © {new Date().getFullYear()} Ecompulse. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 