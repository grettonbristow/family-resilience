"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STOCKPILE_CATEGORIES } from "@/lib/constants";
import ExpiryBadge from "@/components/ExpiryBadge";
import type { StockpileItem, StockpileSummary } from "@/lib/types";

export default function StockpilePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StockpileContent />
    </Suspense>
  );
}

function StockpileContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<StockpileItem[]>([]);
  const [summary, setSummary] = useState<StockpileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string | null>(searchParams.get("filter"));

  useEffect(() => {
    Promise.all([
      fetch("/api/stockpile").then((r) => r.json()),
      fetch("/api/stockpile/summary").then((r) => r.json()),
    ])
      .then(([itemsData, summaryData]) => {
        if (Array.isArray(itemsData)) setItems(itemsData);
        if (summaryData && typeof summaryData.foodDays === "number") setSummary(summaryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = items.filter((item) => {
    if (filter && item.category !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getDurationColor = (days: number) => {
    if (days < 7) return "text-red-600 bg-red-50 border-red-200";
    if (days < 30) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getDurationBarColor = (days: number) => {
    if (days < 7) return "bg-red-500";
    if (days < 30) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Stockpile</h1>
        <Link
          href="/stockpile/add"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl active:bg-indigo-700 transition-colors"
        >
          + Add Item
        </Link>
      </div>

      {/* Duration summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className={`rounded-xl border p-3 ${getDurationColor(summary.foodDays)}`}>
            <p className="text-xs font-semibold uppercase opacity-70">Food</p>
            <p className="text-xl font-bold">{summary.foodDays}d</p>
            <div className="w-full bg-white/50 rounded-full h-1.5 mt-1.5">
              <div
                className={`h-1.5 rounded-full ${getDurationBarColor(summary.foodDays)}`}
                style={{ width: `${Math.min(100, (summary.foodDays / 90) * 100)}%` }}
              />
            </div>
          </div>
          <div className={`rounded-xl border p-3 ${getDurationColor(summary.waterDays)}`}>
            <p className="text-xs font-semibold uppercase opacity-70">Water</p>
            <p className="text-xl font-bold">{summary.waterDays}d</p>
            <div className="w-full bg-white/50 rounded-full h-1.5 mt-1.5">
              <div
                className={`h-1.5 rounded-full ${getDurationBarColor(summary.waterDays)}`}
                style={{ width: `${Math.min(100, (summary.waterDays / 90) * 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border p-3 text-emerald-600 bg-emerald-50 border-emerald-200">
            <p className="text-xs font-semibold uppercase opacity-70">Cash</p>
            <p className="text-xl font-bold">{"\u00A3"}{Math.round(summary.cashTotal)}</p>
          </div>
          <div className="rounded-xl border p-3 text-gray-600 bg-gray-50 border-gray-200">
            <p className="text-xs font-semibold uppercase opacity-70">Energy / Medicine</p>
            <p className="text-xl font-bold">{summary.energyItems + summary.medicineItems} <span className="text-sm font-normal">items</span></p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search stockpile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900 placeholder:text-gray-400"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-hide">
        <button
          onClick={() => setFilter(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filter === null ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          All
        </button>
        {STOCKPILE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(filter === cat.value ? null : cat.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === cat.value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">
            {items.length === 0 ? "No stockpile items yet" : "No items match your search"}
          </p>
          {items.length === 0 && (
            <Link
              href="/stockpile/add"
              className="inline-block mt-3 text-indigo-600 font-medium text-sm"
            >
              Add your first item
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const catInfo = STOCKPILE_CATEGORIES.find((c) => c.value === item.category);
            return (
              <Link
                key={item.id}
                href={`/stockpile/${item.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-3.5 py-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {catInfo?.label ?? item.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.quantity} {item.unit}
                    </span>
                    {item.category === "food" && item.caloriesTotal && (
                      <span className="text-xs text-gray-400">
                        {item.caloriesTotal.toLocaleString()} cal
                      </span>
                    )}
                    {item.expiryDate && <ExpiryBadge expiryDate={item.expiryDate} />}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
