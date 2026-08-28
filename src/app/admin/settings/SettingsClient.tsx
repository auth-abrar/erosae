'use client';

import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';

export default function SettingsClient({ initialSettings }: { initialSettings: any[] }) {
  const [siteName, setSiteName] = useState('Erosae');
  const [tagline, setTagline] = useState('Curated Global Living & Modern Luxury');
  const [announcement, setAnnouncement] = useState('✨ Complimentary GCC & South Asia Express Delivery on Orders Over $75 USD | 10 Regional Currencies Supported');
  const [conciergeEmail, setConciergeEmail] = useState('concierge@erosae.com');
  const [conciergePhone, setConciergePhone] = useState('+971 4 800 EROSAE');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Store Identity & Branding</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Store Name</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Top Announcement Banner Text</label>
          <input
            type="text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
          />
        </div>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Concierge & Customer Support</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Concierge Email</label>
            <input
              type="email"
              value={conciergeEmail}
              onChange={(e) => setConciergeEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Support Phone</label>
            <input
              type="tel"
              value={conciergePhone}
              onChange={(e) => setConciergePhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg transition flex items-center space-x-2"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Settings Saved!' : 'Save Changes'}</span>
        </button>
      </div>
    </form>
  );
}