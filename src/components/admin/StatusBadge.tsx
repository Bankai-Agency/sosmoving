import { Badge } from "./ui/badge";

type Status = "published" | "draft" | "scheduled";

const labels: Record<Status, string> = {
  published: "Опубликовано",
  draft: "Черновик",
  scheduled: "Запланировано",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge variant={status === "published" ? "positive" : status === "scheduled" ? "warning" : "secondary"}>
      {labels[status]}
    </Badge>
  );
}
