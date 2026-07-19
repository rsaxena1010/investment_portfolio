"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Award, Clock, BarChart2 } from "lucide-react";
import type { PortfolioData, Transaction } from "./types";
import type { RealizedTrade } from "./excelParser";
import { xirr } from "./xirr";
import { fmtINR, fmtUSD, fmtPct } from "./Dashboard";

type PricePoint = { date: string; price: number };
type HistoryData = Record<string, PricePoint[]>;
type Period = "3M" | "6M" | "1Y" | "2Y" | "5Y";

const PERIOD_DAYS: Record<Period, number> = {
  "3M": 90, "6M": 180, "1Y": 365, "2Y": 730, "5Y": 1825,
};

function priceAt(points: PricePoint[], date: string): number | null {
  let last: number | null = null;
  for (const p of points) {
    if (p.date <= date) last = p.price;
    else break;
  }
  return last;
}

// ─── Portfolio value time series ─────────────────────────────────────────────

function buildTimeSeries(
  transactions: Transaction[],
  historyData: HistoryData,
  staticINR: number,
  symbols: string[],
  periodDays: number,
): { date: string; valueINR: number }[] {
  const usdinrHist = historyData["USDINR=X"] ?? [];
  if (usdinrHist.length === 0) return [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - periodDays);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);

  const firstTxDate = transactions.length
    ? [...transactions].sort((a, b) => a.date.localeCompare(b.date))[0].date
    : null;

  const startStr = firstTxDate && firstTxDate > cutoffStr ? firstTxDate : cutoffStr;

  const timeline = usdinrHist.filter((p) => p.date >= startStr);

  return timeline.map(({ date, price: usdinr }) => {
    let usdValue = 0;
    for (const sym of symbols) {
      const hist = historyData[sym];
      if (!hist) continue;
      let qty = 0;
      for (const tx of transactions) {
        if (tx.symbol !== sym || tx.date > date) continue;
        qty += tx.type === "Buy" ? tx.quantity : -tx.quantity;
      }
      if (qty <= 0) continue;
      const price = priceAt(hist, date);
      if (price != null) usdValue += qty * price;
    }
    return { date, valueINR: usdValue * usdinr + staticINR };
  });
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ data }: { data: { date: string; valueINR: number }[] }) {
  if (data.length < 2) return null;

  const PAD = { l: 72, r: 16, t: 16, b: 30 };
  const W = 900, H = 230;
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const values = data.map((d) => d.valueINR);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const span = maxV - minV || 1;
  const lo = minV - span * 0.06;
  const hi = maxV + span * 0.06;

  const dates = data.map((d) => new Date(d.date).getTime());
  const minD = Math.min(...dates);
  const maxD = Math.max(...dates);
  const dSpan = maxD - minD || 1;

  const xOf = (ds: string) => PAD.l + ((new Date(ds).getTime() - minD) / dSpan) * innerW;
  const yOf = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * innerH;

  const pathD = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xOf(d.date).toFixed(1)} ${yOf(d.valueINR).toFixed(1)}`)
    .join(" ");
  const last = data[data.length - 1];
  const first = data[0];
  const areaD =
    pathD +
    ` L ${xOf(last.date).toFixed(1)} ${(PAD.t + innerH).toFixed(1)} L ${PAD.l} ${(PAD.t + innerH).toFixed(1)} Z`;

  const totalGain = ((last.valueINR - first.valueINR) / first.valueINR) * 100;
  const lineColor = totalGain >= 0 ? "#10b981" : "#ef4444";

  const yLevels = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    v: lo + (hi - lo) * f,
    y: PAD.t + (1 - f) * innerH,
  }));

  const step = Math.max(1, Math.floor(data.length / 6));
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-2xl font-bold text-gray-900">{fmtINR(last.valueINR)}</span>
        <span className={`text-sm font-semibold ${totalGain >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {totalGain >= 0 ? "+" : ""}{totalGain.toFixed(2)}% from period start
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yLevels.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.l - 5} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="#9ca3af" fontFamily="monospace">
              {fmtINR(v)}
            </text>
          </g>
        ))}
        <path d={areaD} fill="url(#aGrad)" />
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />
        {xLabels.map((d) => (
          <text key={d.date} x={xOf(d.date)} y={H - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {d.date.slice(0, 7)}
          </text>
        ))}
        <circle cx={xOf(first.date)} cy={yOf(first.valueINR)} r="3.5" fill={lineColor} />
        <circle cx={xOf(last.date)} cy={yOf(last.valueINR)} r="3.5" fill={lineColor} />
      </svg>
    </div>
  );
}

// ─── Position returns ─────────────────────────────────────────────────────────

interface PositionReturn {
  symbol: string;
  name: string;
  type: "equity" | "crypto" | "mf" | "aif" | "ppf" | "ssy" | "cash";
  currency: "USD" | "INR";
  invested: number;
  currentVal: number;
  simpleReturnPct: number;
  xirrPct: number | null;
  holdingDays: number | null;
  benchmarkReturnPct: number | null;
}

function buildPositionReturns(
  data: PortfolioData,
  transactions: Transaction[],
  livePrices: Record<string, number>,
  historyData: HistoryData | null,
  usdinr: number,
): PositionReturn[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const results: PositionReturn[] = [];

  const tradeable = [
    ...data.singaporeHoldings.usEquity.map((p) => ({ ...p, qty: p.shares, posType: "equity" as const })),
    ...data.singaporeHoldings.crypto.map((p) => ({ ...p, qty: p.units, posType: "crypto" as const })),
  ];

  for (const pos of tradeable) {
    const txns = transactions.filter((t) => t.symbol === pos.symbol);
    const livePrice = livePrices[pos.symbol] ?? pos.currentPrice;

    const buys = txns.filter((t) => t.type === "Buy");
    const sells = txns.filter((t) => t.type === "Sell");

    const totalCost = buys.reduce((s, t) => s + t.quantity * t.price + t.fees, 0) || pos.qty * pos.avgCost;
    const currentQty = txns.length
      ? txns.reduce((q, t) => q + (t.type === "Buy" ? t.quantity : -t.quantity), 0)
      : pos.qty;
    const totalSellProceeds = sells.reduce((s, t) => s + t.quantity * t.price - t.fees, 0);
    const currentVal = currentQty * livePrice;
    const simpleReturnPct = totalCost > 0 ? ((currentVal + totalSellProceeds - totalCost) / totalCost) * 100 : 0;

    // XIRR
    let xirrPct: number | null = null;
    let holdingDays: number | null = null;
    let earliestDate: Date | null = null;

    if (buys.length > 0) {
      const cfs: { date: Date; amount: number }[] = [];
      for (const t of buys) {
        const d = new Date(t.date);
        cfs.push({ date: d, amount: -(t.quantity * t.price + t.fees) });
        if (!earliestDate || d < earliestDate) earliestDate = d;
      }
      for (const t of sells) {
        cfs.push({ date: new Date(t.date), amount: t.quantity * t.price - t.fees });
      }
      if (currentVal > 0) cfs.push({ date: today, amount: currentVal });
      cfs.sort((a, b) => a.date.getTime() - b.date.getTime());
      const r = xirr(cfs);
      if (r !== null && isFinite(r)) xirrPct = r * 100;
    }

    if (earliestDate) {
      holdingDays = Math.floor((today.getTime() - earliestDate.getTime()) / 86400000);
    }

    // Benchmark (SPY) return from earliest buy date to today
    let benchmarkReturnPct: number | null = null;
    if (historyData && historyData["SPY"] && earliestDate) {
      const startDateStr = earliestDate.toISOString().slice(0, 10);
      const startPrice = priceAt(historyData["SPY"], startDateStr);
      const endPrice = priceAt(historyData["SPY"], todayStr);
      if (startPrice && endPrice) {
        benchmarkReturnPct = ((endPrice - startPrice) / startPrice) * 100;
      }
    }

    results.push({
      symbol: pos.symbol,
      name: pos.name,
      type: pos.posType,
      currency: (pos.currency as "USD" | "INR") ?? "USD",
      invested: totalCost,
      currentVal,
      simpleReturnPct,
      xirrPct,
      holdingDays,
      benchmarkReturnPct,
    });
  }

  // India static positions (no XIRR — no transaction dates)
  for (const f of data.indiaHoldings.mutualFunds) {
    results.push({
      symbol: "MF",
      name: f.name,
      type: "mf",
      currency: "INR",
      invested: f.invested,
      currentVal: f.current,
      simpleReturnPct: f.invested > 0 ? ((f.current - f.invested) / f.invested) * 100 : 0,
      xirrPct: null,
      holdingDays: null,
      benchmarkReturnPct: null,
    });
  }
  for (const f of data.indiaHoldings.aif) {
    results.push({
      symbol: "AIF",
      name: f.name,
      type: "aif",
      currency: "INR",
      invested: f.invested,
      currentVal: f.current,
      simpleReturnPct: f.invested > 0 ? ((f.current - f.invested) / f.invested) * 100 : 0,
      xirrPct: null,
      holdingDays: null,
      benchmarkReturnPct: null,
    });
  }

  return results.sort((a, b) => b.simpleReturnPct - a.simpleReturnPct);
}

// ─── Decision scorecard ───────────────────────────────────────────────────────

interface TradeDecision {
  symbol: string;
  buyDate: string;
  sellDate: string;
  holdingDays: number;
  tradeReturnPct: number;
  benchmarkReturnPct: number | null;
  alphaPct: number | null;
  postSellDrift: number | null; // positive = price fell after sell (good sell); negative = price rose (bad sell)
  currency: "USD" | "INR";
}

function buildDecisionScorecard(
  realizedTrades: RealizedTrade[],
  historyData: HistoryData | null,
): TradeDecision[] {
  const todayStr = new Date().toISOString().slice(0, 10);

  return realizedTrades.map((t) => {
    let benchmarkReturnPct: number | null = null;
    if (historyData && historyData["SPY"]) {
      const bStart = priceAt(historyData["SPY"], t.buyDate);
      const bEnd = priceAt(historyData["SPY"], t.sellDate);
      if (bStart && bEnd) benchmarkReturnPct = ((bEnd - bStart) / bStart) * 100;
    }

    // Post-sell drift: how much did price change after selling?
    let postSellDrift: number | null = null;
    const symHist = historyData?.[t.symbol];
    if (symHist) {
      const priceAtSell = priceAt(symHist, t.sellDate) ?? t.sellPrice;
      const priceNow = priceAt(symHist, todayStr) ?? null;
      if (priceNow) {
        // Positive = price fell after sell (good sell), negative = price rose (missed gains)
        postSellDrift = -((priceNow - priceAtSell) / priceAtSell) * 100;
      }
    }

    const alphaPct =
      benchmarkReturnPct !== null ? t.returnPct - benchmarkReturnPct : null;

    return {
      symbol: t.symbol,
      buyDate: t.buyDate,
      sellDate: t.sellDate,
      holdingDays: t.holdingDays,
      tradeReturnPct: t.returnPct,
      benchmarkReturnPct,
      alphaPct,
      postSellDrift,
      currency: t.currency,
    };
  });
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

interface Props {
  data: PortfolioData;
  transactions: Transaction[];
  realizedTrades: RealizedTrade[];
  historyData: HistoryData | null;
  loadingHistory: boolean;
  livePrices: Record<string, number>;
  liveFX: { USDINR: number | null } | null;
  hide: boolean;
}

const PERIODS: Period[] = ["3M", "6M", "1Y", "2Y", "5Y"];

export default function AnalyticsTab({
  data,
  transactions,
  realizedTrades,
  historyData,
  loadingHistory,
  livePrices,
  liveFX,
  hide,
}: Props) {
  const [period, setPeriod] = useState<Period>("1Y");

  const usdinr = liveFX?.USDINR ?? data.fxRates.USDINR;

  const sgSymbols = [
    ...data.singaporeHoldings.usEquity.map((e) => e.symbol),
    ...data.singaporeHoldings.crypto.map((c) => c.symbol),
  ];

  const staticINR = useMemo(() => {
    const india =
      data.indiaHoldings.mutualFunds.reduce((s, f) => s + f.current, 0) +
      data.indiaHoldings.aif.reduce((s, f) => s + f.current, 0) +
      data.indiaHoldings.ppf.balance +
      data.indiaHoldings.ssy.balance +
      data.indiaHoldings.cash.reduce((s, c) => s + c.balance, 0);
    const re = data.realEstate.reduce((s, p) => s + p.currentValue, 0);
    return india + re;
  }, [data]);

  const timeSeries = useMemo(() => {
    if (!historyData) return [];
    return buildTimeSeries(transactions, historyData, staticINR, sgSymbols, PERIOD_DAYS[period]);
  }, [historyData, transactions, staticINR, sgSymbols, period]);

  const positionReturns = useMemo(
    () => buildPositionReturns(data, transactions, livePrices, historyData, usdinr),
    [data, transactions, livePrices, historyData, usdinr]
  );

  const decisions = useMemo(
    () => buildDecisionScorecard(realizedTrades, historyData),
    [realizedTrades, historyData]
  );

  const Spinner = () => (
    <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
      </svg>
      Fetching market history…
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Portfolio value over time ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              Portfolio Value Over Time
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              SG equity + crypto at live prices · India & RE shown at current snapshot
            </p>
          </div>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === p
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <Spinner />
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Upload an Excel file with a Transactions sheet to see portfolio history.
          </div>
        ) : timeSeries.length < 2 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Not enough historical data for this period.
          </div>
        ) : (
          <LineChart data={timeSeries} />
        )}
      </div>

      {/* ── Returns & XIRR ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            Returns & Annualised XIRR
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            XIRR accounts for timing of each buy/sell — shown for SG equity & crypto only.
            Alpha = your return vs SPY over same holding period.
          </p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-2.5 text-left">Asset</th>
              <th className="px-4 py-2.5 text-left">Type</th>
              <th className="px-4 py-2.5 text-right">Invested</th>
              <th className="px-4 py-2.5 text-right">Current</th>
              <th className="px-4 py-2.5 text-right">Simple Return</th>
              <th className="px-4 py-2.5 text-right">XIRR / yr</th>
              <th className="px-4 py-2.5 text-right">Held</th>
              <th className="px-4 py-2.5 text-right">vs SPY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {positionReturns.map((pos, i) => {
              const alpha =
                pos.benchmarkReturnPct !== null
                  ? pos.simpleReturnPct - pos.benchmarkReturnPct
                  : null;
              const fmt = pos.currency === "USD" ? fmtUSD : fmtINR;
              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-gray-800">{pos.name.slice(0, 30)}</p>
                    {pos.symbol !== "MF" && pos.symbol !== "AIF" && (
                      <p className="text-gray-400 font-mono">{pos.symbol}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 capitalize text-gray-500">{pos.type}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {hide ? "——" : fmt(pos.invested)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-900">
                    {hide ? "——" : fmt(pos.currentVal)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${pos.simpleReturnPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {fmtPct(pos.simpleReturnPct)}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    pos.xirrPct === null
                      ? "text-gray-300"
                      : pos.xirrPct >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}>
                    {pos.xirrPct === null ? "—" : fmtPct(pos.xirrPct)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-500">
                    {pos.holdingDays === null
                      ? "—"
                      : pos.holdingDays >= 365
                      ? `${(pos.holdingDays / 365).toFixed(1)} yr`
                      : `${pos.holdingDays} d`}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${
                    alpha === null ? "text-gray-300" : alpha >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {alpha === null
                      ? "—"
                      : `${alpha >= 0 ? "+" : ""}${alpha.toFixed(1)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Decision Scorecard ── */}
      {decisions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-500" />
              Decision Scorecard
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Rates each buy→sell decision. Alpha = trade return vs SPY over same window.
              Post-sell drift = how price moved after you sold (positive = good sell timing).
            </p>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left">Symbol</th>
                <th className="px-4 py-2.5 text-right">Hold</th>
                <th className="px-4 py-2.5 text-right">Trade return</th>
                <th className="px-4 py-2.5 text-right">SPY return</th>
                <th className="px-4 py-2.5 text-right">Alpha</th>
                <th className="px-4 py-2.5 text-right">Post-sell drift</th>
                <th className="px-4 py-2.5 text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {decisions.map((d, i) => {
                const rating =
                  d.alphaPct === null
                    ? "—"
                    : d.alphaPct >= 10
                    ? "Excellent"
                    : d.alphaPct >= 0
                    ? "Beat market"
                    : d.alphaPct >= -10
                    ? "Underperformed"
                    : "Missed badly";
                const ratingColor =
                  d.alphaPct === null
                    ? "text-gray-400"
                    : d.alphaPct >= 10
                    ? "bg-emerald-100 text-emerald-700"
                    : d.alphaPct >= 0
                    ? "bg-blue-100 text-blue-700"
                    : d.alphaPct >= -10
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-600";

                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-semibold text-gray-900">{d.symbol}</span>
                      <p className="text-gray-400">{d.buyDate} → {d.sellDate}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500 flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3" />
                      {d.holdingDays >= 365
                        ? `${(d.holdingDays / 365).toFixed(1)} yr`
                        : `${d.holdingDays} d`}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${d.tradeReturnPct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {fmtPct(d.tradeReturnPct)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500">
                      {d.benchmarkReturnPct !== null ? fmtPct(d.benchmarkReturnPct) : "—"}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${
                      d.alphaPct === null
                        ? "text-gray-300"
                        : d.alphaPct >= 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}>
                      {d.alphaPct === null
                        ? "—"
                        : `${d.alphaPct >= 0 ? "+" : ""}${d.alphaPct.toFixed(1)}%`}
                    </td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${
                      d.postSellDrift === null
                        ? "text-gray-300"
                        : d.postSellDrift >= 0
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}>
                      {d.postSellDrift === null
                        ? "—"
                        : `${d.postSellDrift >= 0 ? "+" : ""}${d.postSellDrift.toFixed(1)}%`}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {d.alphaPct !== null ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ratingColor}`}>
                          {rating}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── India/RE note ── */}
      <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
        <strong>Note:</strong> India mutual funds, AIFs, PPF, SSY, and real estate do not have live price feeds.
        Their values are shown at the snapshot in your uploaded Excel / JSON file. XIRR is available only for
        Singapore equity & crypto where transaction dates are known.
      </div>
    </div>
  );
}
