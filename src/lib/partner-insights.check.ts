import {
  activityBars,
  activityPeriodStart,
  filterByActivityPeriod,
  partnerKpis,
} from "./partner-insights.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

const apps = [
  { createdAt: "2026-08-16T10:12:00.000Z", status: "in_work", amount: "48 488 BYN" },
  { createdAt: "2026-08-15T09:40:00.000Z", status: "completed", amount: "41 186 BYN" },
  { createdAt: "2026-08-13T11:05:00.000Z", status: "waiting_originals", amount: "50 776 BYN" },
  { createdAt: "2026-08-08T13:20:00.000Z", status: "completed", amount: "38 488 BYN" },
  { createdAt: "2026-07-21T08:15:00.000Z", status: "completed", amount: "42 000 BYN" },
  { createdAt: "2026-06-18T15:45:00.000Z", status: "completed", amount: "38 500 BYN" },
  { createdAt: "2026-05-27T12:30:00.000Z", status: "completed", amount: "35 000 BYN" },
  { createdAt: "2026-05-12T09:00:00.000Z", status: "completed", amount: "36 837 BYN" },
  { createdAt: "2026-07-03T16:10:00.000Z", status: "in_work", amount: "29 500 BYN" },
];

const kpis = partnerKpis(apps);
assertEqual(kpis.applications, 9, "apps");
assertEqual(kpis.deals, 6, "deals");
assertEqual(kpis.financing, 232011, "financing");
assertEqual(kpis.averageCheck, 38669, "average");
assertEqual(Math.round(kpis.conversion * 10), 667, "conversion");

const now = new Date(2026, 7, 18, 12, 0, 0);
const start3m = activityPeriodStart("3m", now);
assertEqual(start3m.getMonth(), 4, "3m starts in May");
assertEqual(start3m.getDate(), 1, "3m starts on the 1st");

const bars = activityBars(apps, "3m", now);
assertEqual(bars.length, 4, "four month bars");
assertEqual(bars[0]?.value, 71837, "May sales");
assertEqual(bars[1]?.value, 38500, "June sales");
assertEqual(bars[2]?.value, 42000, "July sales");
assertEqual(bars[3]?.value, 79674, "August sales");

const week = filterByActivityPeriod(apps, "7d", now);
assertEqual(week.length, 3, "last 7 days has three apps");

console.log("partner-insights checks passed");
