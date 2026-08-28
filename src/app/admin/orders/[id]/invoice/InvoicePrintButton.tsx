'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function InvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-slate-900 hover:bg-brand-600 text-white font-semibold text-xs px-6 py-2.5 rounded-full flex items-center space-x-2 transition shadow-md"
    >
      <Printer className="w-4 h-4" />
      <span>Print / Save PDF</span>
    </button>
  );
}