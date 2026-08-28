import React from 'react';
import prisma from '@/lib/db';
import { Globe, DollarSign, RefreshCw } from 'lucide-react';
import CurrenciesClient from './CurrenciesClient';

export default async function AdminCurrenciesPage() {
  const currencies = await prisma.currency.findMany({
    include: {
      exchangeRates: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">10 Regional Currencies & FX Rates</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage exchange rates relative to USD (1.00 base) and 3-decimal currency formatting rules (KWD, OMR, BHD).
          </p>
        </div>
      </div>

      <CurrenciesClient initialCurrencies={currencies} />
    </div>
  );
}