"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { STOCKPILE_CATEGORIES, MONEY_SUBTYPES, STOCKPILE_UNITS, isMoneyCategory } from "@/lib/constants";
import type { StockpileItem } from "@/lib/types";

export default function EditStockpileItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [mainCategory, setMainCategory] = useState("food");
  const [moneySubType, setMoneySubType] = useState("cash");
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState("kg");
  const [caloriesTotal, setCaloriesTotal] = useState<number | "">("");
  const [valueAmount, setValueAmount] = useState<number | "">("");
  const [daysSupply, setDaysSupply] = useState<number | "">("");
  const [expiryDate, setExpiryDate] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const dbCategory = mainCategory === "money" ? moneySubType : mainCategory;

  useEffect(() => {
    fetch(`/api/stockpile/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((item: StockpileItem) => {
        setName(item.name);
        if (isMoneyCategory(item.category)) {
          setMainCategory("money");
          setMoneySubType(item.category);
        } else {
          setMainCategory(item.category);
        }
        setQuantity(item.quantity);
        setUnit(item.unit);
        setCaloriesTotal(item.caloriesTotal ?? "");
        setValueAmount(item.valueAmount ?? "");
        setDaysSupply(item.daysSupply ?? "");
        setExpiryDate(item.expiryDate ?? "");
        setLocation(item.location ?? "");
        setNotes(item.notes ?? "");
      })
      .catch(() => setError("Item not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMainCategoryChange = (newCat: string) => {
    setMainCategory(newCat);
    setCaloriesTotal("");
    setValueAmount("");
    setDaysSupply("");
    if (newCat === "money") {
      setMoneySubType("cash");
      setUnit("£");
    } else {
      const units = STOCKPILE_UNITS[newCat];
      if (units && units.length > 0 && !units.includes(unit)) setUnit(units[0]);
    }
  };

  const handleMoneySubTypeChange = (subType: string) => {
    setMoneySubType(subType);
    setValueAmount("");
    const units = STOCKPILE_UNITS[subType];
    if (units && units.length > 0) setUnit(units[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/stockpile/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category: dbCategory,
          quantity,
          unit,
          caloriesTotal: mainCategory === "food" && caloriesTotal !== "" ? caloriesTotal : null,
          valueAmount: mainCategory === "money" && valueAmount !== "" ? valueAmount : null,
          daysSupply: (mainCategory === "energy" || mainCategory === "medicine") && daysSupply !== "" ? daysSupply : null,
          expiryDate: expiryDate || null,
          location: location.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      router.push(`/stockpile/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
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

  const units = STOCKPILE_UNITS[dbCategory] || ["units"];

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
        <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <div className="grid grid-cols-5 gap-1.5">
            {STOCKPILE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleMainCategoryChange(cat.value)}
                className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                  mainCategory === cat.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 active:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {mainCategory === "money" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {MONEY_SUBTYPES.map((sub) => (
                <button
                  key={sub.value}
                  type="button"
                  onClick={() => handleMoneySubTypeChange(sub.value)}
                  className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                    moneySubType === sub.value
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
            <input
              id="quantity"
              type="number"
              min={0}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
            />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
            >
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {mainCategory === "food" && (
          <div>
            <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1.5">Total Calories</label>
            <input
              id="calories"
              type="number"
              min={0}
              value={caloriesTotal}
              onChange={(e) => setCaloriesTotal(e.target.value ? parseInt(e.target.value) : "")}
              placeholder="Total calories for this quantity"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {mainCategory === "money" && moneySubType === "cash" && (
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1.5">Value ({"\u00A3"})</label>
            <input
              id="value"
              type="number"
              min={0}
              step="0.01"
              value={valueAmount}
              onChange={(e) => setValueAmount(e.target.value ? parseFloat(e.target.value) : "")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
            />
          </div>
        )}

        {mainCategory === "money" && moneySubType === "gold" && (
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Value ({"\u00A3"})</label>
            <input
              id="value"
              type="number"
              min={0}
              step="0.01"
              value={valueAmount}
              onChange={(e) => setValueAmount(e.target.value ? parseFloat(e.target.value) : "")}
              placeholder="Value per coin in pounds"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {mainCategory === "money" && moneySubType === "savings" && (
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1.5">Amount ({"\u00A3"})</label>
            <input
              id="value"
              type="number"
              min={0}
              step="0.01"
              value={valueAmount}
              onChange={(e) => setValueAmount(e.target.value ? parseFloat(e.target.value) : "")}
              placeholder="Total savings amount in pounds"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {(mainCategory === "energy" || mainCategory === "medicine") && (
          <div>
            <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Days Supply</label>
            <input
              id="days"
              type="number"
              min={0}
              step="any"
              value={daysSupply}
              onChange={(e) => setDaysSupply(e.target.value ? parseFloat(e.target.value) : "")}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
            />
          </div>
        )}

        <div>
          <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
          <input
            id="expiry"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 bg-white"
          />
        </div>

        {error && (
          <div className="text-sm px-3 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}

        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl disabled:opacity-40 active:bg-indigo-700 transition-all shadow-sm text-sm"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
}
