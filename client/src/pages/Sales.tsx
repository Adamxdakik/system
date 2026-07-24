import POS from "@/pages/POS";

interface SalesProps {
  initialTab?: "new" | "history";
  editVoucherId?: string;
}

export default function Sales({ editVoucherId }: SalesProps) {
  return <POS embedded editVoucherId={editVoucherId} />;
}
