"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReadinessRing from "@/components/ReadinessRing";
import CategoryBadge from "@/components/CategoryBadge";
import ExpiryBadge from "@/components/ExpiryBadge";
import type { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Dashboard API failed");
        return res.json();
      })
      .then((d) => {
        // Validate shape before setting
        if (d && Array.isArray(d.scenarioSummaries)) {
          setData(d);
        } else {
          // API returned an error object or unexpected shape — use empty defaults
          setData({
            overallReadiness: 0,
            expiringItems: [],
            lowStockItems: [],
            scenarioSummaries: [],
            totalSupplies: 0,
          });
        }
      })
      .catch(() => {
        setData({
          overallReadiness: 0,
          expiringItems: [],
          lowStockItems: [],
          scenarioSummaries: [],
          totalSupplies: 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 mt-4">Loading dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Family Resilience</h1>
        <p className="text-sm text-red-500">Failed to load dashboard</p>
      </div>
    );
  }

  const hasScenarios = data.scenarioSummaries.length > 0;
  const hasAlerts = data.expiringItems.length > 0 || data.lowStockItems.length > 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Family Resilience</h1>
      <p className="text-sm text-gray-500 mb-5">{data.totalSupplies} supplies tracked</p>

      {/* Readiness score */}
      {hasScenarios ? (
        <div className="flex items-center gap-5 bg-white rounded-2xl border border-gray-200 p-5 mb-5">
          <ReadinessRing percentage={data.overallReadiness} size="lg" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Overall Readiness</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Across {data.scenarioSummaries.length} scenario{data.scenarioSummaries.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5 mb-5 text-center">
          <p className="text-sm font-medium text-indigo-800">No scenarios yet</p>
          <p className="text-xs text-indigo-600 mt-0.5">Create a scenario to start tracking readiness</p>
          <Link
            href="/scenarios/add"
            className="inline-block mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl active:bg-indigo-700 transition-colors"
          >
            Create Scenario
          </Link>
        </div>
      )}

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-2 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alerts</h2>
          {data.expiringItems.map((item) => (
            <Link
              key={`exp-${item.id}`}
              href={`/inventory/${item.id}`}
              className="flex items-center gap-2.5 bg-white rounded-xl border border-amber-200 px-3.5 py-2.5 active:scale-[0.99] transition-transform"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <div className="flex items-center gap-1.5">
                  <CategoryBadge category={item.category} />
                  <ExpiryBadge expiryDate={item.expiryDate} />
                </div>
              </div>
            </Link>
          ))}
          {data.lowStockItems.map((item) => (
            <Link
              key={`low-${item.id}`}
              href={`/inventory/${item.id}`}
              className="flex items-center gap-2.5 bg-white rounded-xl border border-red-200 px-3.5 py-2.5 active:scale-[0.99] transition-transform"
            >
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-red-600">{item.quantity} {item.unit} (min: {item.minimumQuantity})</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Scenario readiness */}
      {hasScenarios && (
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scenarios</h2>
          <div className="space-y-2">
            {data.scenarioSummaries.map((s) => (
              <Link
                key={s.id}
                href={`/scenarios/${s.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-3.5 py-3 active:scale-[0.99] transition-transform"
              >
                <ReadinessRing percentage={s.readiness} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                  <span className="text-[10px] font-semibold uppercase text-gray-400">
                    {s.category.replace("_", " ")}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Link
          href="/inventory/add"
          className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center active:scale-[0.98] transition-transform"
        >
          <p className="text-sm font-semibold text-indigo-600">Add Supply</p>
        </Link>
        <Link
          href="/scenarios/add"
          className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center active:scale-[0.98] transition-transform"
        >
          <p className="text-sm font-semibold text-indigo-600">New Scenario</p>
        </Link>
      </div>
    </div>
  );
}
