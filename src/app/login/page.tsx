'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { Lock, Mail, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/account';

  const { locale, t } = useStore();
  const isBengali = locale === 'bn';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      setSuccessMsg(mode === 'login' ? 'Login successful! Redirecting...' : 'Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push(redirect);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-2 font-bold shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            {mode === 'login'
              ? (isBengali ? 'লগইন করুন' : 'Sign in to Erosae')
              : (isBengali ? 'নতুন একাউন্ট খুলুন' : 'Create an Account')}
          </h1>
          <p className="text-xs text-gray-500">
            {mode === 'login'
              ? (isBengali ? 'আপনার অর্ডার ও ডিজিটাল লাইসেন্স দেখতে লগইন করুন' : 'Access your purchases, digital keys, and loyalty rewards')
              : (isBengali ? 'সহজে কেনাকাটা ও এক্সক্লুসিভ অফারের জন্য যুক্ত হোন' : 'Join Erosae for fast checkout and exclusive member perks')}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block text-gray-600 font-bold mb-1">
                {isBengali ? 'পুরো নাম' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={isBengali ? 'আপনার নাম' : 'e.g. Tanvir Ahmed'}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-600 font-bold mb-1">
              {isBengali ? 'ইমেইল এড্রেস' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-gray-600 font-bold mb-1">
                {isBengali ? 'মোবাইল নম্বর' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+880 1700 000000"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-gray-600 font-bold mb-1">
              {isBengali ? 'পাসওয়ার্ড' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20 transition disabled:opacity-50 mt-2"
          >
            <span>
              {loading
                ? (isBengali ? 'অপেক্ষা করুন...' : 'Processing...')
                : mode === 'login'
                ? (isBengali ? 'লগইন করুন' : 'Sign In')
                : (isBengali ? 'একাউন্ট তৈরি করুন' : 'Create Account')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-xs text-brand-600 hover:text-brand-700 font-bold transition"
          >
            {mode === 'login'
              ? (isBengali ? 'একাউন্ট নেই? নতুন একাউন্ট খুলুন' : "Don't have an account? Sign up")
              : (isBengali ? 'ইতিমধ্যে একাউন্ট আছে? লগইন করুন' : 'Already have an account? Sign in')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh] flex items-center justify-center text-xs text-gray-500">Loading login...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
