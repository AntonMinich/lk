import { formatDateParts } from "../lib/format";

export function DateTimeCell({ value }: { value: string }) {
  const parts = formatDateParts(value);
  if (!parts) {
    return <span>—</span>;
  }
  return (
    <time dateTime={value} className="datetime-cell">
      <span className="datetime-cell__date">{parts.date}</span>
      <span className="datetime-cell__time">{parts.time}</span>
    </time>
  );
}
