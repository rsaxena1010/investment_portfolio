"use client";

import { TrendingUp, TrendingDown, AlertCircle, IndianRupee, DollarSign, Wallet, ChevronUp, ChevronDown, ChevronsUpDown, Pencil, Check, X as XIcon } from "lucide-react";
import type { PortfolioData } from "./types";
import { useState } from "react";
import dynamic from "next/dynamic";
import IndiaDataEditor from "./components/IndiaDataEditor";

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
  onDataChange: (patch: Partial<PortfolioData>) => void;
}

type SortCol = "symbol" | "qty" | "avgCost" | "price" | "valueUSD" | "gainLossUSD" | "gainLossPct";
type SortDir = "asc" | "desc";

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 inline ml-0.5 opacity-30" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-0.5 text-indigo-600" />
    : <ChevronDown className="w-3 h-3 inline ml-0.5 text-indigo-600" />;
}

export default function Dashboard({ data, livePrices, liveFX, inflation, hide, onDataChange }: Props) {
  const [showEditor, setShowEditor] = useState(false);
  const [showIndiaEditor, setShowIndiaEditor] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>("valueUSD");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingDate, setEditingDate] = useState<{ symbol: string; value: string } | null>(null);

  // FX override: user-typed rate takes priority over live Yahoo rate
  const [fxOverride, setFxOverride] = useState<{ USDINR: number; SGDINR: number } | null>(null);
  const [fxEditMode, setFxEditMode] = useState(false);
  const [fxDraft, setFxDraft] = useState({ USDINR: 0, SGDINR: 0 });

  const HoldingsEditor = dynamic(() => import("./components/HoldingsEditor"), { ssr: false });

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  function saveDate(symbol: string, date: string, isEquity: boolean) {
    const now = new Date().toISOString();
    const base = {
      changeLog: [...(data.changeLog ?? []), { timestamp: now, note: `Position date updated — ${symbol}: ${date || "cleared"}` }],
      lastUpdated: now,
    };
    if (isEquity) {
      onDataChange({
        ...base,
        singaporeHoldings: {
          ...data.singaporeHoldings,
          usEquity: data.singaporeHoldings.usEquity.map((e) =>
            e.symbol === symbol ? { ...e, positionDate: date || undefined } : e
          ),
        },
      });
    } else {
      onDataChange({
        ...base,
        singaporeHoldings: {
          ...data.singaporeHoldings,
          crypto: data.singaporeHoldings.crypto.map((c) =>
            c.symbol === symbol ? { ...c, positionDate: date || undefined } : c
          ),
        },
      });
    }
    setEditingDate(null);
  }

  function enterFxEdit() {
    setFxDraft({
      USDINR: fxOverride?.USDINR ?? liveFX?.USDINR ?? data.fxRates.USDINR,
      SGDINR: fxOverride?.SGDINR ?? liveFX?.SGDINR ?? data.fxRates.SGDINR,
    });
    setFxEditMode(true);
  }

  function saveFx() {
    const now = new Date().toISOString();
    setFxOverride(fxDraft);
    onDataChange({
      fxRates: fxDraft,
      changeLog: [
        ...(data.changeLog ?? []),
        { timestamp: now, note: `FX rates updated — USD/INR: ${fxDraft.USDINR.toFixed(2)}, SGD/INR: ${fxDraft.SGDINR.toFixed(2)}` },
      ],
      lastUpdated: now,
    });
    setFxEditMode(false);
  }

  const { indiaHoldings, singaporeHoldings, realEstate, cashflows, watchlist } = data;

  const USDINR = fxOverride?.USDINR ?? liveFX?.USDINR ?? data.fxRates.USDINR;

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

  // ESOPs
  const esopPositions = (data.esops ?? []).map((e) => {
    const toINR = e.currency === "USD" ? USDINR : 1;
    const grossPerShare = Math.max(0, e.currentPrice - e.strikePrice);
    const vestedGross = e.vested * grossPerShare * toINR;
    const unvestedGross = e.unvested * grossPerShare * toINR;
    const vestedNet = vestedGross * (1 - e.taxRate);
    const unvestedNet = unvestedGross * (1 - e.taxRate);
    return { ...e, vestedGross, unvestedGross, vestedNet, unvestedNet, taxLiability: vestedGross * e.taxRate };
  });
  const esopVestedGrossINR = esopPositions.reduce((s, e) => s + e.vestedGross, 0);
  const esopVestedNetINR = esopPositions.reduce((s, e) => s + e.vestedNet, 0);
  const esopUnvestedNetINR = esopPositions.reduce((s, e) => s + e.unvestedNet, 0);
  const esopTaxLiability = esopPositions.reduce((s, e) => s + e.taxLiability, 0);

  // Grand total — includes vested ESOP net of tax
  const grandTotal = indiaLiquid + sgTotalINR + reTotalINR + esopVestedNetINR;
  const indiaPct = grandTotal ? (indiaLiquid / grandTotal) * 100 : 0;
  const sgPct = grandTotal ? (sgTotalINR / grandTotal) * 100 : 0;
  const rePct = grandTotal ? (reTotalINR / grandTotal) * 100 : 0;
  const esopPct = grandTotal ? (esopVestedNetINR / grandTotal) * 100 : 0;

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
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 bg-gray-900 rounded-xl text-xs text-gray-300">
        {fxEditMode ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-400">USD/INR</span>
            <input
              type="number"
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-400"
              value={fxDraft.USDINR || ""}
              onChange={(e) => setFxDraft((d) => ({ ...d, USDINR: parseFloat(e.target.value) || 0 }))}
            />
            <span className="text-gray-400">SGD/INR</span>
            <input
              type="number"
              className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-indigo-400"
              value={fxDraft.SGDINR || ""}
              onChange={(e) => setFxDraft((d) => ({ ...d, SGDINR: parseFloat(e.target.value) || 0 }))}
            />
            <button onClick={saveFx} className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700">
              <Check className="w-3 h-3" /> Save
            </button>
            <button onClick={() => setFxEditMode(false)} className="text-gray-400 hover:text-gray-200">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <span>
              USD/INR{" "}
              <strong className={`text-white ${fxOverride ? "text-yellow-300" : ""}`}>
                {USDINR.toFixed(2)}
              </strong>
              {fxOverride && <span className="ml-1 text-yellow-500 text-[10px]">manual</span>}
              {liveFX?.SGDINR && (
                <span className="ml-3">
                  SGD/INR <strong className="text-white">{(fxOverride?.SGDINR ?? liveFX.SGDINR).toFixed(2)}</strong>
                </span>
              )}
            </span>
            <button onClick={enterFxEdit} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
              <Pencil className="w-3 h-3" /> Edit rates
            </button>
          </>
        )}
        {inflation?.indiaYoY != null && (
          <span>India CPI <strong className={inflation.indiaYoY > 6 ? "text-red-400" : "text-emerald-400"}>{inflation.indiaYoY.toFixed(1)}%</strong></span>
        )}
        {inflation?.usYoY != null && (
          <span>US CPI <strong className={inflation.usYoY > 3 ? "text-red-400" : "text-emerald-400"}>{inflation.usYoY.toFixed(1)}%</strong></span>
        )}
        <span className="ml-auto text-gray-500">Live · auto-refreshes every 5 min</span>
      </div>

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
              ...(esopVestedNetINR > 0 ? [{ label: "ESOPs (net)", valueINR: esopVestedNetINR, color: "#06b6d4" }] : []),
            ]} />
            <div className="space-y-3 text-sm">
              {[
                { label: "India Liquid", value: indiaLiquid, color: "#6366f1" },
                { label: "Singapore/US", value: sgTotalINR, color: "#10b981" },
                { label: "Real Estate", value: reTotalINR, color: "#f59e0b" },
                ...(esopVestedNetINR > 0 ? [{ label: "ESOPs (net)", value: esopVestedNetINR, color: "#06b6d4" }] : []),
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
              ...(esopVestedNetINR > 0 ? [{ label: "ESOPs (net)", pct: esopPct, color: "bg-cyan-500", value: esopVestedNetINR }] : []),
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Singapore / US Positions</h2>
            <div>
              <button
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md"
                onClick={() => setShowEditor((s) => !s)}
              >
                {showEditor ? "Close Editor" : "Edit Holdings"}
              </button>
            </div>
          </div>
        </div>
        {showEditor && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <HoldingsEditor />
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide select-none">
              {([
                { col: "symbol" as SortCol, label: "Symbol", align: "left" },
                { col: null, label: "Name", align: "left" },
                { col: "qty" as SortCol, label: "Qty", align: "right" },
                { col: "avgCost" as SortCol, label: "Avg Cost", align: "right" },
                { col: "price" as SortCol, label: "Live Price", align: "right" },
                { col: "valueUSD" as SortCol, label: "Value (USD)", align: "right" },
                { col: "valueUSD" as SortCol, label: "Value (INR)", align: "right" },
                { col: "gainLossUSD" as SortCol, label: "Gain/Loss $", align: "right" },
                { col: "gainLossPct" as SortCol, label: "Gain/Loss %", align: "right" },
              ] as { col: SortCol | null; label: string; align: string }[]).map(({ col, label, align }) => (
                <th
                  key={label}
                  className={`px-5 py-3 text-${align} ${col ? "cursor-pointer hover:text-gray-800" : ""}`}
                  onClick={col ? () => handleSort(col) : undefined}
                >
                  {label}
                  {col && <SortIcon col={col} active={sortCol === col} dir={sortDir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...equityPositions, ...cryptoPositions]
              .sort((a, b) => {
                const aQty = "shares" in a ? a.shares : a.units;
                const bQty = "shares" in b ? b.shares : b.units;
                const vals: Record<SortCol, number | string> = {
                  symbol: a.symbol, qty: aQty, avgCost: a.avgCost, price: a.price,
                  valueUSD: a.valueUSD, gainLossUSD: a.gainLossUSD, gainLossPct: a.gainLossPct,
                };
                const valsB: Record<SortCol, number | string> = {
                  symbol: b.symbol, qty: bQty, avgCost: b.avgCost, price: b.price,
                  valueUSD: b.valueUSD, gainLossUSD: b.gainLossUSD, gainLossPct: b.gainLossPct,
                };
                const va = vals[sortCol]; const vb = valsB[sortCol];
                const cmp = typeof va === "string" ? (va as string).localeCompare(vb as string) : (va as number) - (vb as number);
                return sortDir === "asc" ? cmp : -cmp;
              })
              .map((pos) => {
                const isPos = pos.gainLossUSD >= 0;
                const qty = "shares" in pos ? pos.shares : pos.units;
                return (
                  <tr key={pos.symbol} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-mono font-semibold text-gray-900">{pos.symbol}</div>
                      {editingDate?.symbol === pos.symbol ? (
                        <input
                          type="date"
                          value={editingDate.value}
                          onChange={(e) => setEditingDate({ symbol: pos.symbol, value: e.target.value })}
                          onBlur={() => saveDate(pos.symbol, editingDate.value, "shares" in pos)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveDate(pos.symbol, editingDate.value, "shares" in pos);
                            if (e.key === "Escape") setEditingDate(null);
                          }}
                          autoFocus
                          className="mt-0.5 text-xs border-b border-indigo-400 outline-none w-28 bg-transparent text-gray-600"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingDate({ symbol: pos.symbol, value: pos.positionDate ?? "" })}
                          className="text-xs text-gray-400 hover:text-indigo-500 mt-0.5 block leading-none"
                        >
                          {pos.positionDate ?? "+ date"}
                        </button>
                      )}
                    </td>
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
                        {hide ? "——" : fmtUSD(pos.gainLossUSD)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-medium ${isPos ? "text-emerald-600" : "text-red-500"}`}>
                        {fmtPct(pos.gainLossPct)}
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
              <td /><td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* India Data Editor */}
      {showIndiaEditor && (
        <IndiaDataEditor
          data={data}
          onChange={(patch) => { onDataChange(patch); setShowIndiaEditor(false); }}
          onClose={() => setShowIndiaEditor(false)}
        />
      )}

      {/* India + RE + Cashflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">India Holdings</h2>
            <button
              onClick={() => setShowIndiaEditor((v) => !v)}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md"
            >
              {showIndiaEditor ? "Close Editor" : "Edit India Data"}
            </button>
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

      {/* ESOPs */}
      {esopPositions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">ESOP Holdings</h2>
              <p className="text-xs text-gray-400 mt-0.5">Vested shares not yet sold · net value after tax shown in portfolio total</p>
            </div>
            <div className="flex gap-4 text-xs text-right">
              <div>
                <p className="text-gray-400">Gross (vested)</p>
                <p className="font-semibold text-gray-800">{hide ? "——" : fmtINR(esopVestedGrossINR)}</p>
              </div>
              <div>
                <p className="text-red-400">Tax liability (~40%)</p>
                <p className="font-semibold text-red-600">{hide ? "——" : `−${fmtINR(esopTaxLiability)}`}</p>
              </div>
              <div>
                <p className="text-emerald-600">Net (in portfolio)</p>
                <p className="font-semibold text-emerald-700">{hide ? "——" : fmtINR(esopVestedNetINR)}</p>
              </div>
              {esopUnvestedNetINR > 0 && (
                <div>
                  <p className="text-cyan-500">Unvested potential (net)</p>
                  <p className="font-semibold text-cyan-700">{hide ? "——" : fmtINR(esopUnvestedNetINR)}</p>
                </div>
              )}
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Company</th>
                <th className="px-5 py-3 text-right">Vested</th>
                <th className="px-5 py-3 text-right">Unvested</th>
                <th className="px-5 py-3 text-right">Strike</th>
                <th className="px-5 py-3 text-right">Current</th>
                <th className="px-5 py-3 text-right">Gross Gain</th>
                <th className="px-5 py-3 text-right text-red-400">Tax ({`~`}40%)</th>
                <th className="px-5 py-3 text-right text-emerald-600">Net Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {esopPositions.map((e, i) => {
                const sym = e.currency === "INR" ? "₹" : "$";
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{e.company}</p>
                      {e.grantDate && <p className="text-xs text-gray-400">Grant: {e.grantDate}</p>}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">{e.vested.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-gray-400">{e.unvested > 0 ? e.unvested.toLocaleString() : "—"}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{hide ? "——" : `${sym}${e.strikePrice.toLocaleString("en-IN")}`}</td>
                    <td className="px-5 py-3 text-right text-gray-800 font-medium">{hide ? "——" : `${sym}${e.currentPrice.toLocaleString("en-IN")}`}</td>
                    <td className="px-5 py-3 text-right text-gray-800">{hide ? "——" : fmtINR(e.vestedGross)}</td>
                    <td className="px-5 py-3 text-right text-red-500">{hide ? "——" : `−${fmtINR(e.taxLiability)}`}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-700">{hide ? "——" : fmtINR(e.vestedNet)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Change Log */}
      {(data.changeLog ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Portfolio Change Log</h2>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {[...(data.changeLog ?? [])].reverse().slice(0, 15).map((entry, i) => (
              <div key={i} className="flex items-start gap-3 text-xs">
                <span className="text-gray-400 shrink-0 font-mono">
                  {new Date(entry.timestamp).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                </span>
                <span className="text-gray-600">{entry.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
