"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CategoryBadge from "@/components/CategoryBadge";
import ExpiryBadge from "@/components/ExpiryBadge";
import QuantityAdjuster from "@/components/QuantityAdjuster";
import type { Supply, SupplyLogEntry } from "@/lib/types";

export default function SupplyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [supply, setSupply] = useState<Supply | null>(null);
  const [log, setLog] = useState<SupplyLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consuming, setConsuming] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [consumeAmount, setConsumeAmount] = useState(1);
  const [restockAmount, setRestockAmount] = useState(1);

  useEffect(() => {
    fetch(`/api/supplies/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Supply not found");
        return res.json();
      })
      .then((data) => {
        setSupply(data);
        setLog(data.log || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleConsume = async () => {
    setConsuming(true);
    try {
      const res = await fetch(`/api/supplies/${id}/consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: consumeAmount }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSupply(updated);
        setLog((prev) => [{ id: 0, supplyId: Number(id), action: "consume", quantity: consumeAmount, createdAt: new Date().toISOString() }, ...prev]);
      }
    } finally {
      setConsuming(false);
    }
  };

  const handleRestock = async () => {
    setRestocking(true);
    try {
      const res = await fetch(`/api/supplies/${id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: restockAmount }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSupply(updated);
        setLog((prev) => [{ id: 0, supplyId: Number(id), action: "restock", quantity: restockAmount, createdAt: new Date().toISOString() }, ...prev]);
      }
    } finally {
      setRestocking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this supply? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/supplies/${id}`, { method: "DELETE" });
      router.push("/inventory");
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

  if (error || !supply) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-700 font-medium mb-2">Supply not found</p>
        <button onClick={() => router.push("/inventory")} className="text-indigo-600 font-medium text-sm">
          Back to inventory
        </button>
      </div>
    );
  }

  const isLowStock = supply.minimumQuantity != null && supply.quantity <= supply.minimumQuantity;

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
        <h1 className="text-2xl font-bold text-gray-900 truncate">{supply.name}</h1>
      </div>

      <div className="space-y-4">
        {/* Info card */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <CategoryBadge category={supply.category} />
            <ExpiryBadge expiryDate={supply.expiryDate} />
            {isLowStock && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                Low Stock
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>
              {supply.quantity}
            </span>
            <span className="text-gray-500">{supply.unit}</span>
            {supply.minimumQuantity != null && supply.minimumQuantity > 0 && (
              <span className="text-xs text-gray-400 ml-2">min: {supply.minimumQuantity}</span>
            )}
          </div>

          {supply.location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {supply.location}
            </div>
          )}

          {supply.expiryDate && (
            <div className="text-sm text-gray-500">
              Expires: {new Date(supply.expiryDate).toLocaleDateString()}
            </div>
          )}

          {supply.notes && (
            <p className="text-sm text-gray-600">{supply.notes}</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Consume</p>
            <div className="flex items-center justify-center">
              <QuantityAdjuster value={consumeAmount} onChange={setConsumeAmount} />
            </div>
            <button
              onClick={handleConsume}
              disabled={consuming || supply.quantity === 0}
              className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium active:bg-red-100 disabled:opacity-40 transition-colors"
            >
              {consuming ? "..." : `Use ${consumeAmount}`}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">Restock</p>
            <div className="flex items-center justify-center">
              <QuantityAdjuster value={restockAmount} onChange={setRestockAmount} />
            </div>
            <button
              onClick={handleRestock}
              disabled={restocking}
              className="w-full py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg text-sm font-medium active:bg-green-100 disabled:opacity-40 transition-colors"
            >
              {restocking ? "..." : `Add ${restockAmount}`}
            </button>
          </div>
        </div>

        {/* Activity log */}
        {log.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Activity</h2>
            <div className="space-y-1">
              {log.slice(0, 10).map((entry, i) => (
                <div key={entry.id || i} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-gray-50">
                  <span className={entry.action === "consume" ? "text-red-600" : "text-green-600"}>
                    {entry.action === "consume" ? "-" : "+"}{entry.quantity} {supply.unit}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit / Delete */}
        <div className="pt-2 space-y-3">
          <button
            onClick={() => router.push(`/inventory/${id}/edit`)}
            className="w-full py-3 text-indigo-600 border border-indigo-200 rounded-xl text-sm font-medium active:bg-indigo-50 transition-colors"
          >
            Edit Supply
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 text-red-500 border border-red-200 rounded-xl text-sm font-medium active:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Supply"}
          </button>
        </div>
      </div>
    </div>
  );
}
