"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReadinessRing from "@/components/ReadinessRing";
import type { Scenario } from "@/lib/types";

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scenarios")
      .then((res) => res.json())
      .then(setScenarios)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 mt-4">Loading scenarios...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Scenarios</h1>
        <Link
          href="/scenarios/add"
          className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No scenarios yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a scenario to start tracking readiness</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/scenarios/${scenario.id}`}
              className="block bg-white rounded-xl border border-gray-200 px-4 py-3.5 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center gap-3">
                <ReadinessRing percentage={scenario.readiness ?? 0} size="sm" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{scenario.name}</h3>
                  {scenario.description && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{scenario.description}</p>
                  )}
                  <span className="text-[10px] font-semibold uppercase text-gray-400 mt-1 inline-block">
                    {scenario.category.replace("_", " ")}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
