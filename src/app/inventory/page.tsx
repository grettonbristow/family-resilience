"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CategoryBadge from "@/components/CategoryBadge";
import ExpiryBadge from "@/components/ExpiryBadge";
import { SUPPLY_CATEGORIES } from "@/lib/constants";
import type { Supply } from "@/lib/types";

export default function InventoryPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/supplies")
      .then((res) => res.json())
      .then(setSupplies)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = supplies.filter((s) => {
    if (categoryFilter && s.category !== categoryFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 mt-4">Loading inventory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Link
          href="/inventory/add"
          className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search supplies..."
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400 mb-3 text-sm"
      />

      <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-4 px-4 no-scrollbar">
        <button
          onClick={() => setCategoryFilter(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            categoryFilter === null
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 active:bg-gray-200"
          }`}
        >
          All
        </button>
        {SUPPLY_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(categoryFilter === cat.value ? null : cat.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              categoryFilter === cat.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 active:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No supplies yet</p>
          <p className="text-sm text-gray-400 mt-1">Tap + to add your first supply</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((supply) => {
            const isLowStock = supply.minimumQuantity != null && supply.quantity <= supply.minimumQuantity;
            return (
              <Link
                key={supply.id}
                href={`/inventory/${supply.id}`}
                className="block bg-white rounded-xl border border-gray-200 px-3.5 py-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{supply.name}</h3>
                      <CategoryBadge category={supply.category} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className={`font-medium ${isLowStock ? "text-red-600" : "text-gray-700"}`}>
                        {supply.quantity} {supply.unit}
                      </span>
                      {isLowStock && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                          Low
                        </span>
                      )}
                      <ExpiryBadge expiryDate={supply.expiryDate} />
                      {supply.location && (
                        <span className="text-gray-400 truncate">{supply.location}</span>
                      )}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
