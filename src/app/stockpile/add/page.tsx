"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { STOCKPILE_CATEGORIES, MONEY_SUBTYPES, STOCKPILE_UNITS } from "@/lib/constants";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddStockpileItemPage() {
  const router = useRouter();
  const productInputRef = useRef<HTMLInputElement>(null);
  const nutritionInputRef = useRef<HTMLInputElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [scanningProduct, setScanningProduct] = useState(false);
  const [scanningNutrition, setScanningNutrition] = useState(false);
  const [scanningExpiry, setScanningExpiry] = useState(false);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [nutritionPreview, setNutritionPreview] = useState<string | null>(null);
  const [expiryPreview, setExpiryPreview] = useState<string | null>(null);
  const [productScanned, setProductScanned] = useState(false);
  const [nutritionScanned, setNutritionScanned] = useState(false);
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

  const handleMainCategoryChange = (newCat: string) => {
    setMainCategory(newCat);
    setCaloriesTotal("");
    setValueAmount("");
    setDaysSupply("");
    setProductPreview(null);
    setNutritionPreview(null);
    setExpiryPreview(null);
    setProductScanned(false);
    setNutritionScanned(false);
    if (newCat === "money") {
      setMoneySubType("cash");
      setUnit("£");
    } else {
      const units = STOCKPILE_UNITS[newCat];
      if (units && units.length > 0) setUnit(units[0]);
    }
  };

  const handleMoneySubTypeChange = (subType: string) => {
    setMoneySubType(subType);
    setValueAmount("");
    const units = STOCKPILE_UNITS[subType];
    if (units && units.length > 0) setUnit(units[0]);
  };

  const handleProductScan = async (file: File) => {
    setScanningProduct(true);
    setError(null);
    setProductPreview(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/stockpile/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mediaType: file.type || "image/jpeg",
          scanType: "product",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }

      const result = await res.json();

      if (result.name) setName(result.name);
      if (typeof result.quantity === "number") setQuantity(result.quantity);
      if (result.unit) {
        const validUnits = STOCKPILE_UNITS["food"] || [];
        if (validUnits.includes(result.unit)) setUnit(result.unit);
      }
      if (typeof result.caloriesTotal === "number") setCaloriesTotal(result.caloriesTotal);
      if (result.expiryDate) setExpiryDate(result.expiryDate);
      setProductScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed. You can still enter details manually.");
    } finally {
      setScanningProduct(false);
    }
  };

  const handleNutritionScan = async (file: File) => {
    setScanningNutrition(true);
    setError(null);
    setNutritionPreview(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/stockpile/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mediaType: file.type || "image/jpeg",
          scanType: "nutrition",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Scan failed");
      }

      const result = await res.json();

      if (typeof result.quantity === "number") setQuantity(result.quantity);
      if (result.unit) {
        const validUnits = STOCKPILE_UNITS["food"] || [];
        if (validUnits.includes(result.unit)) setUnit(result.unit);
      }
      if (typeof result.caloriesTotal === "number") setCaloriesTotal(result.caloriesTotal);
      setNutritionScanned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read nutrition info. Enter details manually.");
    } finally {
      setScanningNutrition(false);
    }
  };

  const handleExpiryScan = async (file: File) => {
    setScanningExpiry(true);
    setError(null);
    setExpiryPreview(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch("/api/stockpile/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mediaType: file.type || "image/jpeg",
          scanType: "expiry",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not read expiry date");
      }

      const result = await res.json();
      if (result.expiryDate) setExpiryDate(result.expiryDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read expiry date. Enter it manually.");
    } finally {
      setScanningExpiry(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/stockpile", {
        method: "POST",
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/stockpile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const units = STOCKPILE_UNITS[dbCategory] || ["units"];
  const isScanning = scanningProduct || scanningNutrition || scanningExpiry;

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
        <h1 className="text-2xl font-bold text-gray-900">Add to Stockpile</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category <span className="text-red-400">*</span>
          </label>
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

        {/* Money sub-type picker */}
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

        {/* Photo scan for food — 3-step (steps 2 & 3 optional) */}
        {mainCategory === "food" && (
          <div className="space-y-2">
            {/* Hidden file inputs */}
            <input ref={productInputRef} type="file" accept="image/*" capture="environment"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProductScan(f); e.target.value = ""; }}
              className="hidden" />
            <input ref={nutritionInputRef} type="file" accept="image/*" capture="environment"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleNutritionScan(f); e.target.value = ""; }}
              className="hidden" />
            <input ref={expiryInputRef} type="file" accept="image/*" capture="environment"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExpiryScan(f); e.target.value = ""; }}
              className="hidden" />

            {/* Step 1: Front of packet (required) */}
            <button
              type="button"
              onClick={() => productInputRef.current?.click()}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl text-sm font-medium text-orange-700 active:bg-orange-100 transition-colors disabled:opacity-60"
            >
              {scanningProduct ? (
                <>
                  <span className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  Reading label...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {productScanned ? "Re-scan Front" : "1. Scan Front of Packet"}
                </>
              )}
            </button>
            {!productScanned && !scanningProduct && (
              <p className="text-xs text-gray-400 text-center">Photo the front label to identify the product</p>
            )}
            {productPreview && (
              <div className="flex items-center gap-3">
                <img src={productPreview} alt="Product" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                {scanningProduct && <p className="text-xs text-gray-500">Analysing label...</p>}
                {productScanned && !scanningProduct && <p className="text-xs text-green-600">Product identified. Review details below.</p>}
              </div>
            )}

            {/* Step 2: Nutrition / quantity (optional, shown after step 1) */}
            {productScanned && (
              <>
                <button
                  type="button"
                  onClick={() => nutritionInputRef.current?.click()}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 bg-blue-50 rounded-xl text-sm font-medium text-blue-700 active:bg-blue-100 transition-colors disabled:opacity-60"
                >
                  {scanningNutrition ? (
                    <>
                      <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Reading nutrition info...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {nutritionScanned ? "Re-scan Nutrition" : "2. Scan Nutrition Label (optional)"}
                    </>
                  )}
                </button>
                {!nutritionScanned && !scanningNutrition && (
                  <p className="text-xs text-gray-400 text-center">Photo the back for weight and calorie info — skip if repacking into mylar bags</p>
                )}
                {nutritionPreview && (
                  <div className="flex items-center gap-3">
                    <img src={nutritionPreview} alt="Nutrition" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    {scanningNutrition && <p className="text-xs text-gray-500">Reading nutrition panel...</p>}
                    {nutritionScanned && !scanningNutrition && <p className="text-xs text-green-600">Quantity and calories updated.</p>}
                  </div>
                )}
              </>
            )}

            {/* Step 3: Expiry date (optional, shown after step 1) */}
            {productScanned && !expiryDate && (
              <>
                <button
                  type="button"
                  onClick={() => expiryInputRef.current?.click()}
                  disabled={isScanning}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl text-sm font-medium text-amber-700 active:bg-amber-100 transition-colors disabled:opacity-60"
                >
                  {scanningExpiry ? (
                    <>
                      <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                      Reading date...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      3. Scan Expiry Date (optional)
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">Photo the best-before / use-by date — skip if repacking</p>
              </>
            )}
            {expiryPreview && (
              <div className="flex items-center gap-3">
                <img src={expiryPreview} alt="Expiry date" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                {scanningExpiry && <p className="text-xs text-gray-500">Reading date...</p>}
                {!scanningExpiry && expiryDate && <p className="text-xs text-green-600">Expiry: {expiryDate}</p>}
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Basmati rice, Tuna tins"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
          />
        </div>

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

        {/* Conditional fields */}
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
            <p className="text-xs text-gray-400 mt-1">Total calories for the full {quantity} {unit} (e.g., 20kg rice = ~72,000 cal)</p>
          </div>
        )}

        {mainCategory === "money" && moneySubType === "cash" && (
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1.5">Value ({"\u00A3"})</label>
            <input id="value" type="number" min={0} step="0.01" value={valueAmount}
              onChange={(e) => setValueAmount(e.target.value ? parseFloat(e.target.value) : "")}
              placeholder="Amount in pounds"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {mainCategory === "money" && moneySubType === "gold" && (
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Value ({"\u00A3"})</label>
            <input id="value" type="number" min={0} step="0.01" value={valueAmount}
              onChange={(e) => setValueAmount(e.target.value ? parseFloat(e.target.value) : "")}
              placeholder="Current value per coin in pounds"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">Value per 1/4 oz coin for tracking total worth</p>
          </div>
        )}

        {mainCategory === "money" && moneySubType === "savings" && (
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1.5">Amount ({"\u00A3"})</label>
            <input id="value" type="number" min={0} step="0.01" value={valueAmount}
              onChange={(e) => setValueAmount(e.target.value ? parseFloat(e.target.value) : "")}
              placeholder="Total savings amount in pounds"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        {(mainCategory === "energy" || mainCategory === "medicine") && (
          <div>
            <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Days Supply</label>
            <input id="days" type="number" min={0} step="any" value={daysSupply}
              onChange={(e) => setDaysSupply(e.target.value ? parseFloat(e.target.value) : "")}
              placeholder="How many days would this last?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
            />
          </div>
        )}

        <div>
          <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
          <input id="expiry" type="date" value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
          <input id="location" type="text" value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Garage shelf, Under stairs"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white placeholder:text-gray-400"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea id="notes" value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Brand, storage method, etc."
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 bg-white placeholder:text-gray-400"
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
            "Add to Stockpile"
          )}
        </button>
      </form>
    </div>
  );
}
