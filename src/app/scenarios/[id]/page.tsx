"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReadinessRing from "@/components/ReadinessRing";
import type { ChecklistItem } from "@/lib/types";

type ScenarioDetail = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  readiness: number;
  checklistItems: ChecklistItem[];
};

export default function ScenarioDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addingItemId, setAddingItemId] = useState<number | null>(null);
  const [addedItemId, setAddedItemId] = useState<number | null>(null);

  const refreshScenario = () => {
    fetch(`/api/scenarios/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Scenario not found");
        return res.json();
      })
      .then(setScenario)
      .catch(() => {});
  };

  useEffect(() => {
    fetch(`/api/scenarios/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Scenario not found");
        return res.json();
      })
      .then(setScenario)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggle = async (item: ChecklistItem) => {
    if (item.itemType === "supply" && item.currentQuantity !== undefined) return;

    const newCompleted = !item.isCompleted;

    setScenario((prev) => {
      if (!prev) return prev;
      const updated = prev.checklistItems.map((i) =>
        i.id === item.id ? { ...i, isCompleted: newCompleted } : i
      );
      const fulfilled = updated.filter((i) => {
        if (i.itemType === "supply" && i.requiredQuantity && i.currentQuantity !== undefined) {
          return i.currentQuantity >= i.requiredQuantity;
        }
        return i.isCompleted;
      }).length;
      const readiness = updated.length > 0 ? Math.round((fulfilled / updated.length) * 100) : 100;
      return { ...prev, checklistItems: updated, readiness };
    });

    await fetch(`/api/scenarios/${id}/checklist`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, isCompleted: newCompleted }),
    });
  };

  const addToInventory = async (item: ChecklistItem) => {
    setAddingItemId(item.id);
    try {
      const res = await fetch("/api/supplies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.description,
          category: item.supplyCategory || "other",
          quantity: item.requiredQuantity || 1,
          unit: item.requiredUnit || "units",
          minimumQuantity: 0,
          expiryDate: null,
          location: null,
          notes: null,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setAddedItemId(item.id);
      refreshScenario();
      setTimeout(() => setAddedItemId(null), 2000);
    } catch {
      // silently fail
    } finally {
      setAddingItemId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this scenario? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/scenarios/${id}`, { method: "DELETE" });
      router.push("/scenarios");
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

  if (error || !scenario) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-gray-700 font-medium mb-2">Scenario not found</p>
        <button onClick={() => router.push("/scenarios")} className="text-indigo-600 font-medium text-sm">
          Back to scenarios
        </button>
      </div>
    );
  }

  const groupedItems = {
    supply: scenario.checklistItems.filter((i) => i.itemType === "supply"),
    action: scenario.checklistItems.filter((i) => i.itemType === "action"),
    document: scenario.checklistItems.filter((i) => i.itemType === "document"),
    skill: scenario.checklistItems.filter((i) => i.itemType === "skill"),
  };

  const groupLabels: Record<string, string> = {
    supply: "Supplies Needed",
    action: "Actions to Take",
    document: "Documents to Prepare",
    skill: "Skills to Learn",
  };

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
          <h1 className="text-xl font-bold text-gray-900 truncate">{scenario.name}</h1>
          <span className="text-[10px] font-semibold uppercase text-gray-400">
            {scenario.category.replace("_", " ")}
          </span>
        </div>
        <ReadinessRing percentage={scenario.readiness} size="md" />
      </div>

      {scenario.description && (
        <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
      )}

      <div className="space-y-5">
        {(["supply", "action", "document", "skill"] as const).map((type) => {
          const items = groupedItems[type];
          if (items.length === 0) return null;

          return (
            <div key={type}>
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {groupLabels[type]} ({items.length})
              </h2>
              <div className="space-y-1.5">
                {items.map((item) => {
                  const isSupply = item.itemType === "supply" && item.requiredQuantity && item.currentQuantity !== undefined;
                  const isFulfilled = isSupply
                    ? item.currentQuantity! >= item.requiredQuantity!
                    : item.isCompleted;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggle(item)}
                      className={`rounded-xl px-3 py-2.5 border transition-colors ${
                        isSupply ? "cursor-default" : "cursor-pointer active:scale-[0.99]"
                      } ${
                        isFulfilled
                          ? "bg-green-50/50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {isSupply ? (
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isFulfilled ? "border-green-500 bg-green-500" : "border-gray-300"
                          }`}>
                            {isFulfilled && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isFulfilled ? "border-green-500 bg-green-500" : "border-gray-300"
                          }`}>
                            {isFulfilled && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${isFulfilled ? "text-gray-400 line-through" : "text-gray-700"}`}>
                            {item.description}
                          </p>
                          {isSupply && (
                            <div className="mt-1.5">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className={isFulfilled ? "text-green-600" : "text-gray-500"}>
                                  {item.currentQuantity} / {item.requiredQuantity} {item.requiredUnit}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    isFulfilled ? "bg-green-500" : "bg-amber-400"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, ((item.currentQuantity ?? 0) / (item.requiredQuantity ?? 1)) * 100)}%`,
                                  }}
                                />
                              </div>
                              {!isFulfilled && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToInventory(item);
                                  }}
                                  disabled={addingItemId === item.id}
                                  className="mt-2 text-xs font-medium text-indigo-600 active:text-indigo-800 disabled:opacity-50"
                                >
                                  {addingItemId === item.id
                                    ? "Adding..."
                                    : addedItemId === item.id
                                    ? "Added!"
                                    : "+ Add to Inventory"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 text-red-500 border border-red-200 rounded-xl text-sm font-medium active:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete Scenario"}
        </button>
      </div>
    </div>
  );
}
