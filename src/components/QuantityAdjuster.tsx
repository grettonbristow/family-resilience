"use client";

type Props = {
  value: number;
  onChange: (n: number) => void;
  min?: number;
};

export default function QuantityAdjuster({ value, onChange, min = 1 }: Props) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors text-lg font-bold"
      >
        -
      </button>
      <span className="text-lg font-semibold w-8 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200 transition-colors text-lg font-bold"
      >
        +
      </button>
    </div>
  );
}
