import React from 'react';
import prisma from '@/lib/db';
import { Settings, Save, Sparkles } from 'lucide-react';
import SettingsClient from './SettingsClient';

export default async function AdminSettingsPage() {
  const settings = await prisma.storeSetting.findMany();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Storefront Settings & Theming</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure site branding, announcement bars, concierge contacts, and regional notices without code changes.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}