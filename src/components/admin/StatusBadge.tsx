type Status = "published" | "draft" | "scheduled";

const styles: Record<Status, string> = {
  published: "bg-positive-soft text-positive",
  draft: "bg-dark/6 text-dark/56",
  scheduled: "bg-warning-soft text-dark",
};

const labels: Record<Status, string> = {
  published: "Опубликовано",
  draft: "Черновик",
  scheduled: "Запланировано",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold leading-none ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
