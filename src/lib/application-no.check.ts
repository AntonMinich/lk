import { formatPartnerApplicationNo, formatLeasingApplicationNo, nextApplicationSeq, fillApplicationSeq } from "./application-no.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(formatPartnerApplicationNo(1), "P-001", "first");
assertEqual(formatPartnerApplicationNo(12), "P-012", "twelve");
assertEqual(formatPartnerApplicationNo(0), "—", "empty");
assertEqual(formatLeasingApplicationNo(44, "2026-08-16T00:00:00.000Z"), "LA-2026-000044", "leasing id");
assertEqual(formatLeasingApplicationNo(0), "—", "leasing empty");
assertEqual(nextApplicationSeq([]), 1, "empty next");
assertEqual(nextApplicationSeq([{ seq: 3 }, { seq: 1 }]), 4, "max plus one");

const filled = fillApplicationSeq([
  { id: "b", createdAt: "2026-08-02T00:00:00.000Z" },
  { id: "a", createdAt: "2026-08-01T00:00:00.000Z" },
  { id: "c", createdAt: "2026-08-03T00:00:00.000Z", seq: 9 },
]);
assertEqual(filled.find((item) => item.id === "a")?.seq, 10, "oldest missing after max");
assertEqual(filled.find((item) => item.id === "c")?.seq, 9, "keeps existing");

console.log("application-no checks passed");
