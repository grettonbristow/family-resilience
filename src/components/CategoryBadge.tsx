import { getCategoryColor, getCategoryLabel } from "@/lib/constants";

type Props = {
  category: string;
};

export default function CategoryBadge({ category }: Props) {
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${getCategoryColor(category)}`}>
      {getCategoryLabel(category)}
    </span>
  );
}
