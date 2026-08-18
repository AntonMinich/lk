import { calculateLease, formatMoney, parseAmount } from "./calculator.ts";

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assertEqual(parseAmount("180 000"), 180000, "spaces");
assertEqual(parseAmount("95,5"), 95.5, "comma");

const zeroRate = calculateLease({
  price: 100_000,
  downPaymentPercent: 20,
  termMonths: 10,
  annualRatePercent: 0,
});
if (!zeroRate) {
  throw new Error("zero rate must calculate");
}
assertEqual(zeroRate.financeAmount, 80_000, "finance amount");
assertEqual(zeroRate.monthlyPayment, 8_000, "zero-rate payment");

const withRate = calculateLease({
  price: 100_000,
  downPaymentPercent: 0,
  termMonths: 12,
  annualRatePercent: 12,
});
if (!withRate) {
  throw new Error("rate must calculate");
}
if (Math.abs(withRate.monthlyPayment - 8884.88) > 0.02) {
  throw new Error(`annuity payment: expected ~8884.88, got ${withRate.monthlyPayment}`);
}

if (calculateLease({ price: 0, downPaymentPercent: 0, termMonths: 12, annualRatePercent: 10 })) {
  throw new Error("zero price must fail");
}

assertEqual(formatMoney(1000).includes("1"), true, "format");

console.log("calculator checks passed");
