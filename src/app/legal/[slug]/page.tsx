'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { ShieldCheck, FileText, Lock, RotateCcw, Truck } from 'lucide-react';

const LEGAL_DOCS: Record<string, { titleEn: string; titleBn: string; contentEn: string; contentBn: string }> = {
  'terms': {
    titleEn: 'Terms & Conditions',
    titleBn: 'শর্তাবলী ও নীতিমালা',
    contentEn: `Welcome to Erosae.com. By accessing or using our website, services, and multi-currency marketplace, you agree to be bound by these terms. All products are offered based on current inventory and pricing. We reserve the right to correct pricing errors and cancel orders if fraudulent activities are detected.`,
    contentBn: `Erosae.com-এ আপনাকে স্বাগতম। আমাদের ওয়েবসাইট ও সেবা ব্যবহারের মাধ্যমে আপনি আমাদের শর্তাবলীর সাথে সম্মতি প্রকাশ করছেন। আমাদের প্ল্যাটফর্মের সমস্ত পণ্য ও কারেন্সি রেট নির্ধারিত নীতিমালা অনুযায়ী পরিচালিত। কোনো প্রতারণামূলক কার্যকলাপের ক্ষেত্রে অর্ডার বাতিল করার অধিকার Erosae সংরক্ষণ করে।`,
  },
  'privacy': {
    titleEn: 'Privacy Policy',
    titleBn: 'গোপনীয়তা নীতি (Privacy Policy)',
    contentEn: `At Erosae, we are committed to safeguarding your privacy. We collect customer information strictly for order processing, billing, and regional delivery. We do not sell or share your personal data with unauthorized third parties. Payment card information is processed directly through PCI-DSS compliant secure gateways.`,
    contentBn: `Erosae আপনার ব্যক্তিগত তথ্যের গোপনীয়তা রক্ষা করতে প্রতিশ্রুতিবদ্ধ। অর্ডার প্রক্রিয়াকরণ ও নিরাপদ হোম ডেলিভারির উদ্দেশ্যেই কেবল গ্রাহকের তথ্য ব্যবহৃত হয়। আমরা কখনোই কোনো অননুমোদিত তৃতীয় পক্ষের সাথে আপনার তথ্য বিনিময় করি না। পেমেন্ট কার্ড তথ্য বিশ্বমানের নিরাপদ গেটওয়ের মাধ্যমে প্রক্রিয়া করা হয়।`,
  },
  'shipping-policy': {
    titleEn: 'Shipping & Delivery Policy',
    titleBn: 'ডেলিভারি ও শিপিং নীতি',
    contentEn: `We provide doorstep delivery across Bangladesh, the UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain, India, Pakistan, and internationally. Standard delivery inside Bangladesh takes 2–4 business days. International delivery takes 5–10 business days depending on customs clearance. Cash on Delivery is available in designated regions.`,
    contentBn: `আমরা বাংলাদেশ ও মধ্যপ্রাচ্যসহ বিশ্বব্যাপী নির্ভরযোগ্য হোম ডেলিভারি সেবা প্রদান করি। বাংলাদেশে ২-৪ কার্যদিবসের মধ্যে এবং আন্তর্জাতিকভাবে ৫-১০ কার্যদিবসে ডেলিভারি সম্পন্ন হয়। নির্ধারিত এলাকায় ক্যাশ অন ডেলিভারি (COD) সুবিধা উপলব্ধ রয়েছে।`,
  },
  'refund-policy': {
    titleEn: 'Return & Refund Policy',
    titleBn: 'রিটার্ন ও রিফান্ড নীতি',
    contentEn: `Customer satisfaction is our highest priority. If you receive a damaged, defective, or incorrect product, you may request a return or replacement within 7 days of delivery. Refunds are credited to the original payment method or issued via bank transfer for Cash on Delivery orders.`,
    contentBn: `গ্রাহক সন্তুষ্টি আমাদের প্রধান অগ্রাধিকার। ডেলিভারিকৃত পণ্যে কোনো ত্রুটি বা অসঙ্গতি থাকলে ৭ দিনের মধ্যে রিটার্ন বা রিপ্লেসমেন্ট আবেদন করতে পারবেন। রিফান্ডের টাকা আপনার মূল পেমেন্ট মাধ্যমে অথবা ক্যাশ অন ডেলিভারির ক্ষেত্রে ব্যাংক/মোবাইল ব্যাংকিংয়ে ফেরত প্রদান করা হয়।`,
  },
  'about': {
    titleEn: 'About Erosae',
    titleBn: 'আমাদের সম্পর্কে',
    contentEn: `Erosae is an authentic, multi-category marketplace designed to deliver top quality electronics, fashion, home essentials, and wellness products with seamless customer support and multi-currency pricing across the globe.`,
    contentBn: `Erosae হলো একটি প্রিমিয়াম মাল্টি-ক্যাটাগরি মার্কেটপ্লেস। বিশ্বমানের পণ্য, নির্ভরযোগ্য কাস্টমার সাপোর্ট এবং বাংলা ও ইংরেজি উভয় ভাষায় গ্রাহকদের সেরা শপিং অভিজ্ঞতা দেওয়াই আমাদের লক্ষ্য।`,
  },
  'contact': {
    titleEn: 'Contact Support',
    titleBn: 'যোগাযোগ ও সহায়তা',
    contentEn: `Need help with an order? Reach our dedicated support team via email at support@erosae.com or call our hotline. We are available 24/7 in English and Bengali.`,
    contentBn: `যেকোনো সহায়তা বা অর্ডারের তথ্যের জন্য আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন: support@erosae.com অথবা আমাদের হটলাইনে কল করুন। আমরা বাংলা ও ইংরেজিতে সার্বক্ষণিক সেবায় প্রস্তুত।`,
  },
};

export default function LegalPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'terms';
  const { locale } = useStore();
  const isBengali = locale === 'bn';

  const doc = LEGAL_DOCS[slug] || LEGAL_DOCS['terms'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-sm space-y-6">
        <h1 className="text-3xl font-black text-gray-900">
          {isBengali ? doc.titleBn : doc.titleEn}
        </h1>
        <div className="prose prose-sm text-gray-600 leading-relaxed space-y-4">
          <p>{isBengali ? doc.contentBn : doc.contentEn}</p>
        </div>
      </div>
    </div>
  );
}
