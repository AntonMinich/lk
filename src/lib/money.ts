export function parseAmountByn(value: string): number {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  if (!digits) {
    return 0;
  }
  const amount = Number(digits);
  return Number.isFinite(amount) ? amount : 0;
}

export function formatAmountByn(value: number): string {
  const amount = Number.isFinite(value) ? Math.round(value) : 0;
  return `${amount.toLocaleString("ru-BY")} BYN`;
}

export function formatPercent(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return `${amount.toLocaleString("ru-BY", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}
