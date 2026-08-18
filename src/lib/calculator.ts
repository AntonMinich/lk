export type LeaseCalcInput = {
  price: number;
  downPaymentPercent: number;
  termMonths: number;
  annualRatePercent: number;
};

export type LeaseCalcResult = {
  financeAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  overpay: number;
};

export function parseAmount(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}

export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat("ru-BY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} BYN`;
}

export function calculateLease(input: LeaseCalcInput): LeaseCalcResult | null {
  const { price, downPaymentPercent, termMonths, annualRatePercent } = input;
  if (!(price > 0) || !(termMonths > 0) || termMonths % 1 !== 0) {
    return null;
  }
  if (downPaymentPercent < 0 || downPaymentPercent >= 100 || annualRatePercent < 0) {
    return null;
  }

  const financeAmount = price * (1 - downPaymentPercent / 100);
  if (!(financeAmount > 0)) {
    return null;
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  const monthlyPayment =
    monthlyRate === 0
      ? financeAmount / termMonths
      : (financeAmount * monthlyRate * (1 + monthlyRate) ** termMonths) /
        ((1 + monthlyRate) ** termMonths - 1);
  const totalPayment = monthlyPayment * termMonths;

  return {
    financeAmount,
    monthlyPayment,
    totalPayment,
    overpay: totalPayment - financeAmount,
  };
}
