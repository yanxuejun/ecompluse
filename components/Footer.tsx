'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer 
      className="w-full border-t bg-white py-6 mt-12"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start px-4">
        <div className="mb-4 md:mb-0 md:w-1/2">
          <h2 className="text-lg font-bold mb-2">Contact Customer Service</h2>
          <div className="space-y-1 text-gray-700 text-sm">
            <div>
              <span className="font-semibold">Phone: </span>
              <a href="tel:0085231122711" className="text-blue-600 underline">00852 31122711</a>
            </div>
            <div>
              <span className="font-semibold">Email: </span>
              <a href="mailto:support@ecompulsedata.com" className="text-blue-600 underline">support@ecompulsedata.com</a>
            </div>
            <div>
              <span className="font-semibold">Address: </span>
              <span>ROOM A1-13, FLOOR 3, 2-28 KWAI LOK STREET, KWAI CHUNG HONG KONG</span>
            </div>
          </div>
        </div>
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
            <span className="text-gray-300">|</span>
            <a
              href="/refund-policy"
              className="text-gray-500 hover:text-gray-900 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Refund and Dispute Policy
            </a>
          </div>
          <div className="text-gray-400">
            © {new Date().getFullYear()} EcomPulseData. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 