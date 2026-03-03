"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SCENARIO_TEMPLATES } from "@/lib/scenarioTemplates";
import { SCENARIO_CATEGORIES } from "@/lib/constants";

type Mode = "choose" | "template" | "custom";

export default function AddScenarioPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom scenario fields
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customCategory, setCustomCategory] = useState("general");

  // Generated checklist preview
  const [generatedData, setGeneratedData] = useState<{
    name: string;
    description: string;
    category: string;
    checklistItems: Array<{ description: string; itemType: string; supplyCategory?: string; requiredQuantity?: number; requiredUnit?: string; sortOrder: number }>;
  } | null>(null);

  const handleTemplateSelect = async (templateIndex: number) => {
    setSaving(true);
    setError(null);
    try {
      const template = SCENARIO_TEMPLATES[templateIndex];
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description,
          category: template.category,
          isCustom: false,
          checklistItems: template.checklistItems,
        }),
      });

      if (!res.ok) throw new Error("Failed to create scenario");
      const data = await res.json();
      router.push(`/scenarios/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!customName.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/scenarios/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: customName.trim(),
          description: customDescription.trim() || undefined,
          householdSize: 2,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setGeneratedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedData) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generatedData.name,
          description: generatedData.description,
          category: generatedData.category || customCategory,
          isCustom: true,
          checklistItems: generatedData.checklistItems,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      router.push(`/scenarios/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => {
            if (mode === "choose") router.back();
            else if (generatedData) setGeneratedData(null);
            else setMode("choose");
          }}
          aria-label="Go back"
          className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200 transition-colors shrink-0"
        >
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === "choose" ? "New Scenario" : mode === "template" ? "Choose Template" : generatedData ? "Review Checklist" : "Custom Scenario"}
        </h1>
      </div>

      {error && (
        <div className="text-sm px-3 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 mb-4">
          {error}
        </div>
      )}

      {/* Mode: Choose */}
      {mode === "choose" && (
        <div className="space-y-3">
          <button
            onClick={() => setMode("template")}
            className="w-full bg-white rounded-xl border border-gray-200 px-4 py-4 text-left active:scale-[0.99] transition-transform"
          >
            <h3 className="text-sm font-semibold text-gray-900">From Template</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose from pre-built scenarios with expert checklists</p>
          </button>
          <button
            onClick={() => setMode("custom")}
            className="w-full bg-white rounded-xl border border-gray-200 px-4 py-4 text-left active:scale-[0.99] transition-transform"
          >
            <h3 className="text-sm font-semibold text-gray-900">Custom (AI-Generated)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Describe a scenario and let AI create a checklist</p>
          </button>
        </div>
      )}

      {/* Mode: Template */}
      {mode === "template" && (
        <div className="space-y-2">
          {SCENARIO_TEMPLATES.map((template, i) => (
            <button
              key={i}
              onClick={() => handleTemplateSelect(i)}
              disabled={saving}
              className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3.5 text-left active:scale-[0.99] transition-transform disabled:opacity-50"
            >
              <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
              <span className="text-[10px] font-semibold uppercase text-indigo-500 mt-1 inline-block">
                {template.checklistItems.length} items
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Mode: Custom - input */}
      {mode === "custom" && !generatedData && (
        <div className="space-y-5">
          <div>
            <label htmlFor="scenario-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Scenario Name <span className="text-red-400">*</span>
            </label>
            <input
              id="scenario-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g., Fuel shortage for 1 month"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="scenario-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optional)
            </label>
            <textarea
              id="scenario-desc"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Add details to help AI generate a better checklist..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SCENARIO_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCustomCategory(cat.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    customCategory === cat.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!customName.trim() || generating}
            className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 active:bg-indigo-700 transition-all shadow-sm text-sm"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating checklist...
              </span>
            ) : (
              "Generate with AI"
            )}
          </button>
        </div>
      )}

      {/* Mode: Custom - review generated checklist */}
      {mode === "custom" && generatedData && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3.5">
            <h3 className="text-sm font-semibold text-gray-900">{generatedData.name}</h3>
            {generatedData.description && (
              <p className="text-xs text-gray-500 mt-0.5">{generatedData.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            {generatedData.checklistItems.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-100 px-3 py-2"
              >
                <div className="flex items-start gap-2">
                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                    item.itemType === "supply" ? "bg-blue-50 text-blue-600"
                    : item.itemType === "action" ? "bg-green-50 text-green-600"
                    : item.itemType === "document" ? "bg-indigo-50 text-indigo-600"
                    : "bg-purple-50 text-purple-600"
                  }`}>
                    {item.itemType}
                  </span>
                  <span className="text-sm text-gray-700">{item.description}</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveGenerated}
            disabled={saving}
            className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 active:bg-indigo-700 transition-all shadow-sm text-sm"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              `Save Scenario (${generatedData.checklistItems.length} items)`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
