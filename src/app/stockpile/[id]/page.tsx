"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { STOCKPILE_CATEGORIES } from "@/lib/constants";
import ExpiryBadge from "@/components/ExpiryBadge";
import type { StockpileItem } from "@/lib/types";

export default function StockpileItemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<StockpileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/stockpile/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this item from your stockpile?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/stockpile/${id}`, { method: "DELETE" });
      router.push("/stockpile");
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-700 font-medium mb-2">Item not found</p>
        <button onClick={() => router.push("/stockpile")} className="text-indigo-600 font-medium text-sm">
          Back to stockpile
        </button>
      </div>
    );
  }

  const catInfo = STOCKPILE_CATEGORIES.find((c) => c.value === item.category);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200 transition-colors shrink-0"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{item.name}</h1>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${catInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
            {catInfo?.label ?? item.category}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Quantity</span>
          <span className="text-sm font-semibold text-gray-900">{item.quantity} {item.unit}</span>
        </div>

        {item.category === "food" && item.caloriesTotal && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Total Calories</span>
            <span className="text-sm font-semibold text-gray-900">{item.caloriesTotal.toLocaleString()}</span>
          </div>
        )}

        {item.category === "cash" && item.valueAmount != null && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Value</span>
            <span className="text-sm font-semibold text-gray-900">{"\u00A3"}{item.valueAmount.toFixed(2)}</span>
          </div>
        )}

        {(item.category === "energy" || item.category === "medicine") && item.daysSupply != null && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Days Supply</span>
            <span className="text-sm font-semibold text-gray-900">{item.daysSupply} days</span>
          </div>
        )}

        {item.expiryDate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Expiry</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900">{item.expiryDate}</span>
              <ExpiryBadge expiryDate={item.expiryDate} />
            </div>
          </div>
        )}

        {item.location && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Location</span>
            <span className="text-sm text-gray-900">{item.location}</span>
          </div>
        )}

        {item.notes && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href={`/stockpile/${item.id}/edit`}
          className="block w-full py-3 text-center bg-white border border-gray-200 rounded-xl text-sm font-medium text-indigo-600 active:bg-gray-50 transition-colors"
        >
          Edit Item
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 text-red-500 border border-red-200 rounded-xl text-sm font-medium active:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Item"}
        </button>
      </div>
    </div>
  );
}
