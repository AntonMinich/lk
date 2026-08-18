import { parseAmountByn } from "./money.ts";

export type ActivityRange = "7d" | "month" | "3m" | "year";

export const ACTIVITY_RANGES: { key: ActivityRange; label: string }[] = [
  { key: "7d", label: "7 дней" },
  { key: "month", label: "Месяц" },
  { key: "3m", label: "3 месяца" },
  { key: "year", label: "Год" },
];

export type InsightApplication = {
  createdAt: string;
  status: string;
  amount: string;
};

export type PartnerKpis = {
  applications: number;
  deals: number;
  conversion: number;
  financing: number;
  averageCheck: number;
};

export type ActivityBar = {
  key: string;
  label: string;
  value: number;
};

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function activityPeriodStart(range: ActivityRange, now: Date): Date {
  const start = startOfDay(now);
  if (range === "7d") {
    start.setDate(start.getDate() - 6);
    return start;
  }
  if (range === "month") {
    start.setDate(1);
    return start;
  }
  if (range === "3m") {
    start.setMonth(start.getMonth() - 3, 1);
    return start;
  }
  start.setMonth(0, 1);
  return start;
}

export function isInPeriod(iso: string, start: Date, end: Date): boolean {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) {
    return false;
  }
  return time >= start.getTime() && time <= end.getTime();
}

export function filterByActivityPeriod<T extends { createdAt: string }>(
  items: T[],
  range: ActivityRange,
  now: Date,
): T[] {
  const start = activityPeriodStart(range, now);
  const end = endOfDay(now);
  return items.filter((item) => isInPeriod(item.createdAt, start, end));
}

export function partnerKpis(apps: InsightApplication[]): PartnerKpis {
  const deals = apps.filter((item) => item.status === "completed");
  const financing = deals.reduce((sum, item) => sum + parseAmountByn(item.amount), 0);
  const applications = apps.length;
  return {
    applications,
    deals: deals.length,
    conversion: applications === 0 ? 0 : (deals.length / applications) * 100,
    financing,
    averageCheck: deals.length === 0 ? 0 : Math.round(financing / deals.length),
  };
}

function monthLabel(date: Date, long: boolean): string {
  const raw = date.toLocaleDateString("ru-RU", { month: long ? "long" : "short" });
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
}

function sumCompleted(apps: InsightApplication[], start: Date, end: Date): number {
  return apps
    .filter((item) => item.status === "completed" && isInPeriod(item.createdAt, start, new Date(end.getTime() - 1)))
    .reduce((sum, item) => sum + parseAmountByn(item.amount), 0);
}

function monthBars(apps: InsightApplication[], from: Date, count: number, long: boolean): ActivityBar[] {
  const bars: ActivityBar[] = [];
  for (let index = 0; index < count; index += 1) {
    const start = new Date(from.getFullYear(), from.getMonth() + index, 1);
    const end = new Date(from.getFullYear(), from.getMonth() + index + 1, 1);
    bars.push({
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: monthLabel(start, long),
      value: sumCompleted(apps, start, end),
    });
  }
  return bars;
}

export function activityBars(apps: InsightApplication[], range: ActivityRange, now: Date): ActivityBar[] {
  if (range === "7d") {
    return Array.from({ length: 7 }, (_, index) => {
      const start = startOfDay(now);
      start.setDate(start.getDate() - 6 + index);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return {
        key: `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`,
        label: start.toLocaleDateString("ru-BY", { day: "2-digit", month: "2-digit" }),
        value: sumCompleted(apps, start, end),
      };
    });
  }

  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const bars: ActivityBar[] = [];
    let cursor = new Date(start);
    while (cursor < monthEnd) {
      const chunkStart = new Date(cursor);
      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + 7);
      if (chunkEnd > monthEnd) {
        chunkEnd.setTime(monthEnd.getTime());
      }
      const lastDay = new Date(chunkEnd.getTime() - 1);
      bars.push({
        key: chunkStart.toISOString(),
        label:
          chunkStart.getDate() === lastDay.getDate()
            ? String(chunkStart.getDate())
            : `${chunkStart.getDate()}–${lastDay.getDate()}`,
        value: sumCompleted(apps, chunkStart, chunkEnd),
      });
      cursor = chunkEnd;
    }
    return bars;
  }

  if (range === "3m") {
    const from = activityPeriodStart("3m", now);
    return monthBars(apps, from, 4, true);
  }

  const from = new Date(now.getFullYear(), 0, 1);
  return monthBars(apps, from, now.getMonth() + 1, false);
}
