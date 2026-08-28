import React from 'react';
import prisma from '@/lib/db';
import { CreditCard, Plus, ShieldCheck, Lock } from 'lucide-react';
import GatewaysClient from './GatewaysClient';

export default async function AdminPaymentGatewaysPage() {
  const gateways = await prisma.paymentGateway.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Gateway Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure pre-built payment providers or add structured generic connectors without touching code.
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>All gateway secrets are encrypted with AES-256-GCM at rest and masked in UI displays.</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">PCI-DSS Tokenized</span>
      </div>

      <GatewaysClient initialGateways={gateways} />
    </div>
  );
}