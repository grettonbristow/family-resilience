"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STOCKPILE_CATEGORIES, MONEY_SUBTYPES, isMoneyCategory } from "@/lib/constants";
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
  const initialFilter = searchParams.get("filter");
  // Map old direct filters (cash/gold/savings) to money
  const [filter, setFilter] = useState<string | null>(
    initialFilter && isMoneyCategory(initialFilter) ? "money" : initialFilter
  );

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
    if (filter === "money") {
      if (!isMoneyCategory(item.category)) return false;
    } else if (filter && item.category !== filter) {
      return false;
    }
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getDurationColor = (days: number) => {
    if (days < 7) return "text-red-600 bg-red-50 border-red-200";
    if (days < 30) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  // Total money value for the combined card
  const totalMoney = summary
    ? (summary.cashTotal ?? 0) + (summary.savingsTotal ?? 0) + (summary.goldOz ?? 0) * 0 // gold shown separately as oz
    : 0;

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
        <div className="space-y-2 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <div className={`rounded-xl border p-2.5 ${getDurationColor(summary.foodDays)}`}>
              <p className="text-[10px] font-semibold uppercase opacity-70">Food</p>
              <p className="text-lg font-bold">{summary.foodDays > 0 ? `${summary.foodDays}d` : "—"}</p>
            </div>
            <div className={`rounded-xl border p-2.5 ${getDurationColor(summary.waterDays)}`}>
              <p className="text-[10px] font-semibold uppercase opacity-70">Water</p>
              <p className="text-lg font-bold">{summary.waterDays > 0 ? `${summary.waterDays}d` : "—"}</p>
            </div>
          </div>
          {/* Money card with breakdown */}
          <div className="rounded-xl border p-3 bg-emerald-50 border-emerald-200">
            <p className="text-[10px] font-semibold uppercase text-emerald-600 opacity-70 mb-1.5">Money</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-emerald-500 uppercase">Cash</p>
                <p className="text-base font-bold text-emerald-700">{"\u00A3"}{Math.round(summary.cashTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] text-yellow-600 uppercase">Gold</p>
                <p className="text-base font-bold text-yellow-700">{summary.goldOz > 0 ? `${summary.goldOz}oz` : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-violet-500 uppercase">Savings</p>
                <p className="text-base font-bold text-violet-700">{"\u00A3"}{Math.round(summary.savingsTotal ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border p-2.5 text-amber-600 bg-amber-50 border-amber-200">
              <p className="text-[10px] font-semibold uppercase opacity-70">Energy</p>
              <p className="text-lg font-bold">{summary.energyItems}</p>
            </div>
            <div className="rounded-xl border p-2.5 text-red-600 bg-red-50 border-red-200">
              <p className="text-[10px] font-semibold uppercase opacity-70">Medicine</p>
              <p className="text-lg font-bold">{summary.medicineItems}</p>
            </div>
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
            const isMoney = isMoneyCategory(item.category);
            const subType = isMoney ? MONEY_SUBTYPES.find((s) => s.value === item.category) : null;
            const mainCat = isMoney
              ? STOCKPILE_CATEGORIES.find((c) => c.value === "money")
              : STOCKPILE_CATEGORIES.find((c) => c.value === item.category);

            return (
              <Link
                key={item.id}
                href={`/stockpile/${item.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-3.5 py-3 active:scale-[0.99] transition-transform"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${mainCat?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {subType ? subType.label : (mainCat?.label ?? item.category)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.quantity} {item.unit}
                    </span>
                    {item.category === "food" && item.caloriesTotal && (
                      <span className="text-xs text-gray-400">
                        {item.caloriesTotal.toLocaleString()} cal
                      </span>
                    )}
                    {item.category === "gold" && (
                      <span className="text-xs text-gray-400">
                        {item.quantity * 0.25} oz
                      </span>
                    )}
                    {isMoney && item.valueAmount != null && (
                      <span className="text-xs text-gray-400">
                        {"\u00A3"}{item.category === "gold" ? (item.valueAmount * item.quantity).toFixed(0) : item.valueAmount.toFixed(0)}
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
