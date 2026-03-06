"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Settings, Child, Pet } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [householdSize, setHouseholdSize] = useState(2);
  const [children, setChildren] = useState<Child[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [expiryWarningDays, setExpiryWarningDays] = useState(30);
  const [lowStockAlertEnabled, setLowStockAlertEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data: Settings) => {
        setHouseholdSize(data.householdSize);
        setChildren(data.children ?? []);
        setPets(data.pets ?? []);
        setExpiryWarningDays(data.expiryWarningDays);
        setLowStockAlertEnabled(data.lowStockAlertEnabled);
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load settings" }))
      .finally(() => setLoading(false));
  }, []);

  const addChild = () => setChildren([...children, { name: "", ageYears: 0 }]);
  const removeChild = (idx: number) => setChildren(children.filter((_, i) => i !== idx));
  const updateChild = (idx: number, field: keyof Child, value: string | number) => {
    setChildren(children.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addPet = () => setPets([...pets, { name: "", type: "dog" }]);
  const removePet = (idx: number) => setPets(pets.filter((_, i) => i !== idx));
  const updatePet = (idx: number, field: keyof Pet, value: string) => {
    setPets(pets.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdSize, children, pets, expiryWarningDays, lowStockAlertEnabled }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMessage({ type: "success", text: "Settings saved" });
    } catch {
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/")}
          aria-label="Go to dashboard"
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Household</h2>

          <div>
            <label htmlFor="household-size" className="block text-sm font-medium text-gray-700 mb-1.5">
              Household Size
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHouseholdSize(Math.max(1, householdSize - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 text-lg font-bold"
              >
                -
              </button>
              <span className="text-xl font-bold w-8 text-center">{householdSize}</span>
              <button
                type="button"
                onClick={() => setHouseholdSize(householdSize + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 text-lg font-bold"
              >
                +
              </button>
              <span className="text-sm text-gray-500">
                {householdSize === 1 ? "person" : "people"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Used by AI to scale supply recommendations</p>
          </div>
        </div>

        {/* Children */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Children</h2>
            <button
              type="button"
              onClick={addChild}
              className="text-xs font-semibold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg active:bg-indigo-100"
            >
              + Add Child
            </button>
          </div>
          {children.length === 0 && (
            <p className="text-xs text-gray-400">No children added. Tap + to add.</p>
          )}
          {children.map((child, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={child.name}
                onChange={(e) => updateChild(idx, "name", e.target.value)}
                placeholder="Name"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
              />
              <input
                type="number"
                min={0}
                max={17}
                value={child.ageYears}
                onChange={(e) => updateChild(idx, "ageYears", parseInt(e.target.value) || 0)}
                className="w-16 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white text-center"
              />
              <span className="text-xs text-gray-400 shrink-0">yrs</span>
              <button
                type="button"
                onClick={() => removeChild(idx)}
                className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 active:bg-red-100 shrink-0"
                aria-label="Remove child"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {children.some((c) => c.ageYears <= 2) && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Toddlers need extra supplies: milk, nappies, formula, baby food
            </p>
          )}
        </div>

        {/* Pets */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Pets</h2>
            <button
              type="button"
              onClick={addPet}
              className="text-xs font-semibold text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg active:bg-indigo-100"
            >
              + Add Pet
            </button>
          </div>
          {pets.length === 0 && (
            <p className="text-xs text-gray-400">No pets added. Tap + to add.</p>
          )}
          {pets.map((pet, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={pet.name}
                onChange={(e) => updatePet(idx, "name", e.target.value)}
                placeholder="Name"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
              />
              <select
                value={pet.type}
                onChange={(e) => updatePet(idx, "type", e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="bird">Bird</option>
                <option value="fish">Fish</option>
                <option value="rabbit">Rabbit</option>
                <option value="other">Other</option>
              </select>
              <button
                type="button"
                onClick={() => removePet(idx)}
                className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 active:bg-red-100 shrink-0"
                aria-label="Remove pet"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-900">Alerts</h2>

          <div>
            <label htmlFor="expiry-days" className="block text-sm font-medium text-gray-700 mb-1.5">
              Expiry Warning (days)
            </label>
            <input
              id="expiry-days"
              type="number"
              min={1}
              max={365}
              value={expiryWarningDays}
              onChange={(e) => setExpiryWarningDays(parseInt(e.target.value) || 30)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-400 mt-1">Show warning for items expiring within this many days</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Low stock alerts</p>
              <p className="text-xs text-gray-400">Highlight items below minimum quantity</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={lowStockAlertEnabled}
              onClick={() => setLowStockAlertEnabled(!lowStockAlertEnabled)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                lowStockAlertEnabled ? "bg-indigo-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  lowStockAlertEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`text-sm px-3 py-2.5 rounded-xl border ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 active:bg-indigo-700 transition-all shadow-sm text-sm"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
