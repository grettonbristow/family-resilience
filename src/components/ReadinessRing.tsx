type Props = {
  percentage: number;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { width: 40, stroke: 4, fontSize: "text-[10px]" },
  md: { width: 64, stroke: 5, fontSize: "text-sm" },
  lg: { width: 96, stroke: 6, fontSize: "text-xl" },
};

export default function ReadinessRing({ percentage, size = "md" }: Props) {
  const { width, stroke, fontSize } = SIZES[size];
  const radius = (width - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 66
      ? "text-green-500"
      : percentage >= 33
      ? "text-amber-500"
      : "text-red-500";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width, height: width }}>
      <svg className="transform -rotate-90" width={width} height={width}>
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-gray-100"
        />
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-500`}
        />
      </svg>
      <span className={`absolute font-bold ${fontSize} ${color}`}>
        {percentage}%
      </span>
    </div>
  );
}
