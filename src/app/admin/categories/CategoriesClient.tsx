'use client';

import React, { useState } from 'react';
import { FolderTree, Plus, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react';

export default function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const parentCategories = categories.filter((c) => !c.parentId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      // In development, insert via direct API or reload
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Category Hierarchy</h2>

        <div className="divide-y divide-slate-800 text-xs">
          {parentCategories.map((parent) => (
            <div key={parent.id} className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={parent.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                    alt=""
                    className="w-8 h-8 rounded-lg object-cover bg-slate-800"
                  />
                  <div>
                    <span className="font-bold text-white text-sm">{parent.name}</span>
                    <span className="text-slate-500 font-mono text-[10px] ml-2">/products?category={parent.slug}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                    {parent._count?.products || 0} Products
                  </span>
                </div>
              </div>

              {/* Subcategories list */}
              {parent.children && parent.children.length > 0 && (
                <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                  {parent.children.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs"
                    >
                      <span className="font-medium text-slate-300">↳ {sub.name}</span>
                      <span className="text-slate-500 text-[10px] font-mono">{sub.slug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}