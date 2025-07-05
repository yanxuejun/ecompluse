'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer 
      className="w-full py-6 flex flex-col items-center border-t mt-12 text-gray-400 text-sm bg-white"
    >
      © {new Date().getFullYear()} Ecompulse. All rights reserved.
    </footer>
  );
} 