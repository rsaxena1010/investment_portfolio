"use client";

import { TrendingUp, TrendingDown, AlertCircle, IndianRupee, DollarSign, Wallet } from "lucide-react";
import type { PortfolioData } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmtINR(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function fmtUSD(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

// ─── DonutChart ───────────────────────────────────────────────────────────────

interface Segment { label: string; valueINR: number; color: string }

function DonutChart({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, seg) => s + seg.valueINR, 0);
  if (total === 0) return null;
  const R = 70, CX = 100, CY = 100;
  const CIRC = 2 * Math.PI * R;
  let cumulative = 0;

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px]">
      {segments.map((seg, i) => {
        const pct = seg.valueINR / total;
        const dash = pct * CIRC;
        const offset = -cumulative * CIRC;
        cumulative += pct;
        return (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={seg.color} strokeWidth={28}
            strokeDasharray={`${dash} ${CIRC - dash}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        );
      })}
      <circle cx={CX} cy={CY} r={56} fill="white" />
    </svg>
  );
}

// ─── HBarChart ────────────────────────────────────────────────────────────────

interface BarItem { label: string; pct: number }

function HBarChart({ items }: { items: BarItem[] }) {
  const maxAbs = Math.max(...items.map((i) => Math.abs(i.pct)), 1);
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const barWidth = (Math.abs(item.pct) / maxAbs) * 50;
        const isPos = item.pct >= 0;
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-32 truncate text-gray-600 text-right shrink-0">{item.label}</span>
            <div className="flex-1 flex items-center">
              <div className="w-1/2 flex justify-end">
                {!isPos && (
                  <div className="h-5 rounded-l bg-red-400 flex items-center justify-end pr-1 text-white font-medium"
                    style={{ width: `${barWidth * 2}%` }}>
                    {fmtPct(item.pct)}
                  </div>
                )}
              </div>
              <div className="w-px h-5 bg-gray-300 shrink-0" />
              <div className="w-1/2 flex justify-start">
                {isPos && (
                  <div className="h-5 rounded-r bg-emerald-400 flex items-center justify-start pl-1 text-white font-medium"
                    style={{ width: `${barWidth * 2}%` }}>
                    {fmtPct(item.pct)}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, icon: Icon, iconBg, positive }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string; positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && (
          <p className={`text-xs mt-0.5 font-medium ${positive === undefined ? "text-gray-400" : positive ? "text-emerald-600" : "text-red-500"}`}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

interface Props {
  data: PortfolioData;
  livePrices: Record<string, number>;
  liveFX: { USDINR: number | null; SGDINR: number | null } | null;
  inflation: { indiaYoY: number | null; usYoY: number | null } | null;
  hide: boolean;
}

export default function Dashboard({ data, livePrices, liveFX, inflation, hide }: Props) {
  const { indiaHoldings, singaporeHoldings, realEstate, cashflows, watchlist } = data;

  const USDINR = liveFX?.USDINR ?? data.fxRates.USDINR;

  // India totals
  const mfCurrent = indiaHoldings.mutualFunds.reduce((s, f) => s + f.current, 0);
  const aifCurrent = indiaHoldings.aif.reduce((s, f) => s + f.current, 0);
  const ppfBal = indiaHoldings.ppf.balance;
  const ssyBal = indiaHoldings.ssy.balance;
  const cashBal = indiaHoldings.cash.reduce((s, c) => s + c.balance, 0);
  const indiaLiquid = mfCurrent + aifCurrent + ppfBal + ssyBal + cashBal;

  // Singapore totals
  const equityPositions = singaporeHoldings.usEquity.map((pos) => {
    const price = livePrices[pos.symbol] ?? pos.currentPrice;
    const cost = pos.shares * pos.avgCost;
    const value = pos.shares * price;
    return { ...pos, price, cost, valueUSD: value, gainLossUSD: value - cost, gainLossPct: ((value - cost) / cost) * 100 };
  });
  const cryptoPositions = singaporeHoldings.crypto.map((pos) => {
    const price = livePrices[pos.symbol] ?? pos.currentPrice;
    const cost = pos.units * pos.avgCost;
    const value = pos.units * price;
    return { ...pos, price, cost, valueUSD: value, gainLossUSD: value - cost, gainLossPct: ((value - cost) / cost) * 100 };
  });

  const sgTotalUSD = [...equityPositions, ...cryptoPositions].reduce((s, p) => s + p.valueUSD, 0);
  const sgTotalINR = sgTotalUSD * USDINR;

  // Real estate
  const reTotalINR = realEstate.reduce((s, p) => s + p.currentValue, 0);
  const rentAnnual = realEstate.reduce((s, p) => s + p.monthlyRent * 12, 0);

  // Grand total
  const grandTotal = indiaLiquid + sgTotalINR + reTotalINR;
  const indiaPct = grandTotal ? (indiaLiquid / grandTotal) * 100 : 0;
  const sgPct = grandTotal ? (sgTotalINR / grandTotal) * 100 : 0;
  const rePct = grandTotal ? (reTotalINR / grandTotal) * 100 : 0;

  // Cashflows
  const totalInflow = cashflows.inflows.reduce((s, f) => s + f.annual, 0);
  const totalOutflow = cashflows.outflows.reduce((s, f) => s + f.annual, 0);
  const netCashflow = totalInflow - totalOutflow;

  // Performance items
  const perfItems: BarItem[] = [
    ...indiaHoldings.mutualFunds.map((f) => ({ label: f.name.slice(0, 24), pct: ((f.current - f.invested) / f.invested) * 100 })),
    ...indiaHoldings.aif.map((f) => ({ label: f.name.slice(0, 24), pct: ((f.current - f.invested) / f.invested) * 100 })),
    ...equityPositions.map((p) => ({ label: p.symbol, pct: p.gainLossPct })),
    ...cryptoPositions.map((p) => ({ label: p.name, pct: p.gainLossPct })),
    ...realEstate.map((p) => ({ label: p.name.slice(0, 24), pct: ((p.currentValue - p.purchasePrice) / p.purchasePrice) * 100 })),
  ];

  const sorted = [...perfItems].sort((a, b) => b.pct - a.pct);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const alertItems = watchlist.filter((w) =>
    w.trigger > w.currentValue ? w.currentValue >= w.trigger * 0.95 : w.currentValue <= w.trigger * 1.05
  );

  return (
    <div className="space-y-6">
      {/* Market data bar */}
      {(liveFX || inflation) && (
        <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-gray-900 rounded-xl text-xs text-gray-300">
          {liveFX?.USDINR && <span>USD/INR <strong className="text-white">{liveFX.USDINR.toFixed(2)}</strong></span>}
          {liveFX?.SGDINR && <span>SGD/INR <strong className="text-white">{liveFX.SGDINR.toFixed(2)}</strong></span>}
          {inflation?.indiaYoY != null && (
            <span>India CPI <strong className={inflation.indiaYoY > 6 ? "text-red-400" : "text-emerald-400"}>{inflation.indiaYoY.toFixed(1)}%</strong></span>
          )}
          {inflation?.usYoY != null && (
            <span>US CPI <strong className={inflation.usYoY > 3 ? "text-red-400" : "text-emerald-400"}>{inflation.usYoY.toFixed(1)}%</strong></span>
          )}
          <span className="ml-auto text-gray-500">Live market data</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total Portfolio" value={hide ? "——" : fmtINR(grandTotal)}
          sub={hide ? undefined : `1 USD = ₹${USDINR.toFixed(2)}`}
          icon={IndianRupee} iconBg="bg-indigo-600" />
        <SummaryCard label="India Holdings" value={hide ? `${indiaPct.toFixed(1)}%` : fmtINR(indiaLiquid)}
          sub={hide ? "of portfolio" : `${indiaPct.toFixed(1)}% of portfolio`}
          icon={Wallet} iconBg="bg-violet-600" />
        <SummaryCard label="Singapore / US" value={hide ? `${sgPct.toFixed(1)}%` : fmtINR(sgTotalINR)}
          sub={hide ? "of portfolio" : `${fmtUSD(sgTotalUSD)} @ ₹${USDINR.toFixed(2)}`}
          icon={DollarSign} iconBg="bg-emerald-600" />
        <SummaryCard label="Net Annual Cashflow"
          value={hide ? (netCashflow >= 0 ? "Positive" : "Negative") : fmtINR(Math.abs(netCashflow))}
          sub={hide ? undefined : netCashflow >= 0 ? `+${fmtINR(netCashflow)} surplus` : `${fmtINR(netCashflow)} deficit`}
          icon={netCashflow >= 0 ? TrendingUp : TrendingDown}
          iconBg={netCashflow >= 0 ? "bg-teal-600" : "bg-red-600"}
          positive={netCashflow >= 0} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Asset Allocation</h2>
          <div className="flex items-center gap-4">
            <DonutChart segments={[
              { label: "India Liquid", valueINR: indiaLiquid, color: "#6366f1" },
              { label: "Singapore/US", valueINR: sgTotalINR, color: "#10b981" },
              { label: "Real Estate", valueINR: reTotalINR, color: "#f59e0b" },
            ]} />
            <div className="space-y-3 text-sm">
              {[
                { label: "India Liquid", value: indiaLiquid, color: "#6366f1" },
                { label: "Singapore/US", value: sgTotalINR, color: "#10b981" },
                { label: "Real Estate", value: reTotalINR, color: "#f59e0b" },
              ].map((seg) => (
                <div key={seg.label} className="flex items-start gap-2">
                  <div className="w-3 h-3 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: seg.color }} />
                  <div>
                    <p className="font-medium text-gray-700">{seg.label}</p>
                    <p className="text-gray-500 text-xs">
                      {hide ? `${((seg.value / grandTotal) * 100).toFixed(1)}%` : fmtINR(seg.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Geographic Split</h2>
          <div className="space-y-4">
            {[
              { label: "India Liquid", pct: indiaPct, color: "bg-indigo-500", value: indiaLiquid },
              { label: "Singapore/US", pct: sgPct, color: "bg-emerald-500", value: sgTotalINR },
              { label: "Real Estate", pct: rePct, color: "bg-amber-500", value: reTotalINR },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{hide ? `${item.pct.toFixed(1)}%` : fmtINR(item.value)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
            {!hide && rentAnnual > 0 && (
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                <span>Rental Yield</span>
                <span className="font-medium text-gray-700">{fmtINR(rentAnnual)}/yr</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Insights</h2>
          <div className="space-y-3">
            {best && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-emerald-800">Top performer</p>
                  <p className="text-emerald-700">{best.label} at {fmtPct(best.pct)}</p>
                </div>
              </div>
            )}
            {worst && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <TrendingDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-red-800">Weakest holding</p>
                  <p className="text-red-700">{worst.label} at {fmtPct(worst.pct)}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-blue-800">Cashflow</p>
                <p className="text-blue-700">
                  {hide
                    ? netCashflow >= 0 ? "Annual surplus" : "Annual deficit"
                    : `${netCashflow >= 0 ? "Surplus" : "Deficit"} of ${fmtINR(Math.abs(netCashflow))}/yr`}
                </p>
              </div>
            </div>
            {alertItems.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-semibold text-amber-800">{alertItems.length} watchlist trigger(s) near</p>
                  <p className="text-amber-700">{alertItems.map((w) => w.name).join(", ")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance by Holding (% gain/loss)</h2>
        <HBarChart items={perfItems} />
      </div>

      {/* Singapore positions table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Singapore / US Positions</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Symbol</th>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-right">Qty</th>
              <th className="px-5 py-3 text-right">Avg Cost</th>
              <th className="px-5 py-3 text-right">Live Price</th>
              <th className="px-5 py-3 text-right">Value (USD)</th>
              <th className="px-5 py-3 text-right">Value (INR)</th>
              <th className="px-5 py-3 text-right">Gain/Loss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...equityPositions, ...cryptoPositions].map((pos) => {
              const isPos = pos.gainLossUSD >= 0;
              const qty = "shares" in pos ? pos.shares : pos.units;
              return (
                <tr key={pos.symbol} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">{pos.symbol}</td>
                  <td className="px-5 py-3 text-gray-600">{pos.name}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{qty}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{hide ? "——" : fmtUSD(pos.avgCost)}</td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {hide ? "——" : fmtUSD(pos.price)}
                    {livePrices[pos.symbol] && <span className="ml-1 text-xs text-emerald-500">●</span>}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">{hide ? "——" : fmtUSD(pos.valueUSD)}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">{hide ? "——" : fmtINR(pos.valueUSD * USDINR)}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-medium ${isPos ? "text-emerald-600" : "text-red-500"}`}>
                      {hide ? fmtPct(pos.gainLossPct) : `${fmtUSD(pos.gainLossUSD)} (${fmtPct(pos.gainLossPct)})`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold text-sm border-t border-gray-200">
              <td className="px-5 py-3 text-gray-700" colSpan={5}>Total</td>
              <td className="px-5 py-3 text-right text-gray-900">{hide ? "——" : fmtUSD(sgTotalUSD)}</td>
              <td className="px-5 py-3 text-right text-gray-900">{hide ? `${sgPct.toFixed(1)}%` : fmtINR(sgTotalINR)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* India + RE + Cashflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">India Holdings</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Holding</th>
                <th className="px-5 py-3 text-right">{hide ? "% of India" : "Value (INR)"}</th>
                <th className="px-5 py-3 text-right">Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {indiaHoldings.mutualFunds.map((f) => {
                const ret = ((f.current - f.invested) / f.invested) * 100;
                return (
                  <tr key={f.name} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{f.name}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{hide ? `${((f.current / indiaLiquid) * 100).toFixed(1)}%` : fmtINR(f.current)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${ret >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmtPct(ret)}</td>
                  </tr>
                );
              })}
              {indiaHoldings.aif.map((f) => {
                const ret = ((f.current - f.invested) / f.invested) * 100;
                return (
                  <tr key={f.name} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{f.name}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{hide ? `${((f.current / indiaLiquid) * 100).toFixed(1)}%` : fmtINR(f.current)}</td>
                    <td className={`px-5 py-3 text-right font-medium ${ret >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmtPct(ret)}</td>
                  </tr>
                );
              })}
              {[
                { name: indiaHoldings.ppf.name, value: ppfBal },
                { name: indiaHoldings.ssy.name, value: ssyBal },
                ...indiaHoldings.cash.map((c) => ({ name: c.name, value: c.balance })),
              ].map((item) => (
                <tr key={item.name} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{item.name}</td>
                  <td className="px-5 py-3 text-right font-medium text-gray-900">{hide ? `${((item.value / indiaLiquid) * 100).toFixed(1)}%` : fmtINR(item.value)}</td>
                  <td className="px-5 py-3 text-right text-gray-400">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">Real Estate</h2>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {realEstate.map((p) => {
                  const ret = ((p.currentValue - p.purchasePrice) / p.purchasePrice) * 100;
                  return (
                    <tr key={p.name} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-800">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.monthlyRent > 0 ? `Rent: ${hide ? "——" : fmtINR(p.monthlyRent)}/mo` : "No rental income"}</p>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-gray-900">{hide ? `${((p.currentValue / reTotalINR) * 100).toFixed(1)}%` : fmtINR(p.currentValue)}</td>
                      <td className={`px-5 py-3 text-right font-medium ${ret >= 0 ? "text-emerald-600" : "text-red-500"}`}>{fmtPct(ret)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Annual Cashflows</h2>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-emerald-600 font-semibold mb-2 uppercase tracking-wide">Inflows</p>
                {cashflows.inflows.map((f) => (
                  <div key={f.name} className="flex justify-between mb-1 text-gray-600">
                    <span>{f.name}</span>
                    <span className="font-medium text-gray-800">{hide ? "——" : fmtINR(f.annual)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between font-semibold text-gray-800">
                  <span>Total In</span>
                  <span className="text-emerald-600">{hide ? "——" : fmtINR(totalInflow)}</span>
                </div>
              </div>
              <div>
                <p className="text-red-500 font-semibold mb-2 uppercase tracking-wide">Outflows</p>
                {cashflows.outflows.map((f) => (
                  <div key={f.name} className="flex justify-between mb-1 text-gray-600">
                    <span>{f.name}</span>
                    <span className="font-medium text-gray-800">{hide ? "——" : fmtINR(f.annual)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between font-semibold text-gray-800">
                  <span>Total Out</span>
                  <span className="text-red-500">{hide ? "——" : fmtINR(totalOutflow)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Watchlist & Alerts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {watchlist.map((item) => {
            const nearTrigger = item.trigger > item.currentValue
              ? item.currentValue >= item.trigger * 0.95
              : item.currentValue <= item.trigger * 1.05;
            return (
              <div key={item.name} className={`p-4 rounded-lg border text-xs ${nearTrigger ? "border-amber-300 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{item.name}</span>
                  {nearTrigger && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <p className="text-gray-500">Current: <span className="font-medium text-gray-700">{hide ? "——" : item.currentValue.toLocaleString()}</span></p>
                <p className="text-gray-500">Trigger: <span className="font-medium text-gray-700">{item.trigger.toLocaleString()}</span></p>
                <p className="text-gray-400 mt-1 leading-relaxed">{item.note}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
