"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import type { Transaction } from "./types";
import type { RealizedTrade } from "./excelParser";

interface Props {
  transactions: Transaction[];
  realizedTrades: RealizedTrade[];
  hide: boolean;
  usdinr: number;
}

function fmtCurrency(amount: number, currency: "USD" | "INR") {
  if (currency === "USD") {
    return `$${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  const abs = Math.abs(amount);
  if (abs >= 1e7) return `₹${(abs / 1e7).toFixed(2)} Cr`;
  if (abs >= 1e5) return `₹${(abs / 1e5).toFixed(2)} L`;
  return `₹${abs.toLocaleString("en-IN")}`;
}

type SortKey = "date" | "symbol" | "type" | "quantity" | "price" | "total";
type SortDir = "asc" | "desc";

export default function TransactionsTab({ transactions, realizedTrades, hide, usdinr }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState<"all" | "Buy" | "Sell">("all");
  const [search, setSearch] = useState("");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = useMemo(() => {
    const list = transactions
      .filter((t) => filter === "all" || t.type === filter)
      .filter((t) =>
        search === "" ||
        t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase())
      );

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.localeCompare(b.date);
      else if (sortKey === "symbol") cmp = a.symbol.localeCompare(b.symbol);
      else if (sortKey === "type") cmp = a.type.localeCompare(b.type);
      else if (sortKey === "quantity") cmp = a.quantity - b.quantity;
      else if (sortKey === "price") cmp = a.price - b.price;
      else if (sortKey === "total") cmp = (a.quantity * a.price) - (b.quantity * b.price);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [transactions, filter, search, sortKey, sortDir]);

  // Summary stats
  const totalBought = transactions
    .filter((t) => t.type === "Buy")
    .reduce((s, t) => s + t.quantity * t.price + t.fees, 0);
  const totalSold = transactions
    .filter((t) => t.type === "Sell")
    .reduce((s, t) => s + t.quantity * t.price - t.fees, 0);
  const totalFees = transactions.reduce((s, t) => s + t.fees, 0);
  const realizedPnL = realizedTrades.reduce((s, t) => s + t.pnl, 0);

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors group"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? "text-indigo-500" : "text-gray-300 group-hover:text-gray-400"}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invested", value: hide ? "——" : fmtCurrency(totalBought, "USD"), sub: "all buys incl. fees", color: "bg-indigo-600" },
          { label: "Total Sold", value: hide ? "——" : fmtCurrency(totalSold, "USD"), sub: "proceeds after fees", color: "bg-violet-600" },
          { label: "Realized P&L", value: hide ? (realizedPnL >= 0 ? "Gain" : "Loss") : fmtCurrency(Math.abs(realizedPnL), "USD"), sub: realizedPnL >= 0 ? "profit on closed trades" : "loss on closed trades", color: realizedPnL >= 0 ? "bg-emerald-600" : "bg-red-600", positive: realizedPnL >= 0 },
          { label: "Total Fees Paid", value: hide ? "——" : fmtCurrency(totalFees, "USD"), sub: "commissions + charges", color: "bg-amber-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className={`w-2 h-8 rounded-full shrink-0 mt-0.5 ${card.color}`} />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${
                "positive" in card ? card.positive ? "text-emerald-700" : "text-red-600" : "text-gray-900"
              }`}>
                {card.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Realized trades */}
      {realizedTrades.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Realized Trades (FIFO)</h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left">Symbol</th>
                <th className="px-4 py-2.5 text-left">Sell Date</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Buy Price</th>
                <th className="px-4 py-2.5 text-right">Sell Price</th>
                <th className="px-4 py-2.5 text-right">Realized P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {realizedTrades.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-900">{t.symbol}</td>
                  <td className="px-4 py-2.5 text-gray-600">{t.sellDate}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{t.qty}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{hide ? "——" : fmtCurrency(t.buyPrice, t.currency)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{hide ? "——" : fmtCurrency(t.sellPrice, t.currency)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-semibold flex items-center justify-end gap-1 ${t.pnl >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {t.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {hide ? (t.pnl >= 0 ? "+" : "−") : `${t.pnl >= 0 ? "+" : "−"}${fmtCurrency(t.pnl, t.currency)}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200 font-semibold text-xs">
                <td className="px-4 py-2.5 text-gray-700" colSpan={5}>Total Realized P&L</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={realizedPnL >= 0 ? "text-emerald-700" : "text-red-600"}>
                    {hide ? (realizedPnL >= 0 ? "Gain" : "Loss") : `${realizedPnL >= 0 ? "+" : "−"}${fmtCurrency(realizedPnL, "USD")}`}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Transaction log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-700 shrink-0">Transaction Log</h2>
          <div className="flex items-center gap-3 ml-auto">
            <input
              type="text"
              placeholder="Search symbol or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-300"
            />
            {(["all", "Buy", "Sell"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  filter === f ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            No transactions yet. Upload an Excel file with a Transactions sheet to get started.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2.5 text-left"><SortBtn k="date" label="Date" /></th>
                <th className="px-4 py-2.5 text-left"><SortBtn k="symbol" label="Symbol" /></th>
                <th className="px-4 py-2.5 text-left">Name</th>
                <th className="px-4 py-2.5 text-left"><SortBtn k="type" label="Type" /></th>
                <th className="px-4 py-2.5 text-right"><SortBtn k="quantity" label="Qty" /></th>
                <th className="px-4 py-2.5 text-right"><SortBtn k="price" label="Price" /></th>
                <th className="px-4 py-2.5 text-right">Fees</th>
                <th className="px-4 py-2.5 text-right"><SortBtn k="total" label="Total" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((t, i) => {
                const total = t.quantity * t.price;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500">{t.date}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-gray-900">{t.symbol}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[160px] truncate">{t.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                        t.type === "Buy" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      }`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{t.quantity}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{hide ? "——" : fmtCurrency(t.price, t.currency)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-500">{hide ? "——" : fmtCurrency(t.fees, t.currency)}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">{hide ? "——" : fmtCurrency(total, t.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
