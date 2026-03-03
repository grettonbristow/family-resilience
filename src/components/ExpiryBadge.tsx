import { getExpiryStatus } from "@/lib/constants";

type Props = {
  expiryDate: string | null;
  warningDays?: number;
};

export default function ExpiryBadge({ expiryDate, warningDays = 30 }: Props) {
  const status = getExpiryStatus(expiryDate, warningDays);
  if (!status || status === "ok") return null;

  const now = new Date();
  const expiry = new Date(expiryDate!);
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (status === "expired") {
    return (
      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">
        Expired
      </span>
    );
  }

  return (
    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
      Exp. {daysUntil}d
    </span>
  );
}
