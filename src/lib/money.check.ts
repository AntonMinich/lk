import { formatAmountByn, formatPercent, parseAmountByn } from "./money.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(parseAmountByn("48 488 BYN"), 48488, "spaces");
assertEqual(parseAmountByn("232011"), 232011, "plain");
assertEqual(parseAmountByn(""), 0, "empty");

const money = formatAmountByn(232011);
if (!money.includes("232") || !money.includes("011") || !money.endsWith("BYN")) {
  throw new Error(`formatAmountByn: unexpected ${money}`);
}

const percent = formatPercent(66.6666667);
if (!percent.includes("66") || !percent.includes("%")) {
  throw new Error(`formatPercent: unexpected ${percent}`);
}

console.log("money checks passed");
