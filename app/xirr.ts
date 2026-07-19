function npv(rate: number, flows: { days: number; amount: number }[]): number {
  return flows.reduce((s, f) => s + f.amount / Math.pow(1 + rate, f.days / 365), 0);
}

function npvDeriv(rate: number, flows: { days: number; amount: number }[]): number {
  return flows.reduce(
    (s, f) => s - (f.days / 365) * f.amount / Math.pow(1 + rate, f.days / 365 + 1),
    0
  );
}

export function xirr(cashflows: { date: Date; amount: number }[]): number | null {
  if (cashflows.length < 2) return null;
  const t0 = cashflows[0].date.getTime();
  const flows = cashflows.map((cf) => ({
    days: (cf.date.getTime() - t0) / 86400000,
    amount: cf.amount,
  }));

  let rate = 0.1;
  for (let i = 0; i < 300; i++) {
    const f = npv(rate, flows);
    const df = npvDeriv(rate, flows);
    if (Math.abs(df) < 1e-14) break;
    const next = rate - f / df;
    if (!isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-9) return isFinite(next) ? next : null;
    rate = Math.max(-0.9999, Math.min(100, next));
  }
  return null;
}
