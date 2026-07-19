"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Eye, EyeOff, RefreshCw, LayoutDashboard, List, Settings, TrendingUp, Download } from "lucide-react";
import Dashboard from "./Dashboard";
import TransactionsTab from "./TransactionsTab";
import AnalyticsTab from "./AnalyticsTab";
import ExcelUpload from "./ExcelUpload";
import type { PortfolioData, Transaction, MarketData } from "./types";
import { computeFIFO } from "./excelParser";

type PricePoint = { date: string; price: number };

const LS_DATA = "portfolio_data_v1";
const LS_TXN = "portfolio_txn_v1";
const LS_SRC = "portfolio_source_v1";

type Tab = "dashboard" | "transactions" | "analytics" | "data";

function minutesAgo(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  return diff === 0 ? "just now" : `${diff} min ago`;
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataSource, setDataSource] = useState<"json" | "excel">("json");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [privacyMode, setPrivacyMode] = useState(false);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [market, setMarket] = useState<MarketData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [historyData, setHistoryData] = useState<Record<string, PricePoint[]> | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load portfolio data on mount — localStorage first, then JSON default
  useEffect(() => {
    const src = localStorage.getItem(LS_SRC);
    if (src === "excel") {
      try {
        const raw = localStorage.getItem(LS_DATA);
        const txRaw = localStorage.getItem(LS_TXN);
        if (raw) {
          setData(JSON.parse(raw));
          setDataSource("excel");
          if (txRaw) setTransactions(JSON.parse(txRaw));
          return;
        }
      } catch {
        // fall through to JSON
      }
    }
    fetch("/portfolio-data.json")
      .then((r) => r.json())
      .then(setData);
  }, []);

  // Auto-fetch FX rates + inflation on mount, then refresh every 5 min
  useEffect(() => {
    const fetchMarket = () =>
      fetch("/api/market")
        .then((r) => r.json())
        .then((d: MarketData) => setMarket(d))
        .catch(() => {});

    setLoadingMarket(true);
    fetchMarket().finally(() => setLoadingMarket(false));

    const id = setInterval(fetchMarket, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Tick so "X mins ago" text stays fresh
  useEffect(() => {
    if (!lastRefreshed) return;
    const t = setInterval(() => setRefreshTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, [lastRefreshed]);

  const refreshPrices = useCallback(async () => {
    if (!data || refreshing) return;
    setRefreshing(true);
    const symbols = [
      ...data.singaporeHoldings.usEquity.map((e) => e.symbol),
      ...data.singaporeHoldings.crypto.map((c) => c.symbol),
    ].join(",");
    try {
      const [priceRes, marketRes] = await Promise.allSettled([
        fetch(`/api/prices?symbols=${symbols}`),
        fetch("/api/market"),
      ]);
      if (priceRes.status === "fulfilled" && priceRes.value.ok)
        setLivePrices(await priceRes.value.json());
      if (marketRes.status === "fulfilled" && marketRes.value.ok)
        setMarket(await marketRes.value.json());
      setLastRefreshed(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [data, refreshing]);

  const handleDataChange = useCallback((patch: Partial<PortfolioData>) => {
    setData((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem(LS_DATA, JSON.stringify(updated));
      localStorage.setItem(LS_SRC, "excel");
      return updated;
    });
    setDataSource("excel");
  }, []);

  const handleExport = useCallback(async () => {
    if (!data) return;
    const { exportPortfolioToExcel } = await import("./excelParser");
    const buffer = exportPortfolioToExcel(data, transactions, livePrices);
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data, transactions, livePrices]);

  const handleExcelUpload = useCallback((d: PortfolioData, txn: Transaction[]) => {
    setData(d);
    setTransactions(txn);
    setDataSource("excel");
    setLivePrices({});
    setHistoryData(null); // reset so analytics re-fetches for new symbols
    localStorage.setItem(LS_DATA, JSON.stringify(d));
    localStorage.setItem(LS_TXN, JSON.stringify(txn));
    localStorage.setItem(LS_SRC, "excel");
    setActiveTab("dashboard");
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(LS_DATA);
    localStorage.removeItem(LS_TXN);
    localStorage.removeItem(LS_SRC);
    setDataSource("json");
    setTransactions([]);
    setLivePrices({});
    setHistoryData(null);
    fetch("/portfolio-data.json").then((r) => r.json()).then(setData);
  }, []);

  // Lazy-fetch 5y history when Analytics tab is first opened
  useEffect(() => {
    if (activeTab !== "analytics" || historyData !== null || loadingHistory || !data) return;
    setLoadingHistory(true);
    const symbols = [
      ...data.singaporeHoldings.usEquity.map((e) => e.symbol),
      ...data.singaporeHoldings.crypto.map((c) => c.symbol),
      "USDINR=X",
      "SPY",
    ].join(",");
    fetch(`/api/history?symbols=${symbols}&range=5y`)
      .then((r) => r.json())
      .then((d) => setHistoryData(d as Record<string, PricePoint[]>))
      .catch(() => setHistoryData({}))
      .finally(() => setLoadingHistory(false));
  }, [activeTab, historyData, loadingHistory, data]);

  const realizedTrades = useMemo(() => computeFIFO(transactions), [transactions]);
  const usdinr = market?.fx?.USDINR ?? data?.fxRates?.USDINR ?? 84.5;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: List },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "data", label: "Data Source", icon: Settings },
  ];

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {dataSource === "excel" ? "From uploaded Excel file" : "From portfolio-data.json"}
            {loadingMarket && <span className="ml-2 text-gray-400">· Fetching live rates…</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="text-xs text-gray-400" key={refreshTick}>
              Prices: {minutesAgo(lastRefreshed)}
            </span>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            onClick={refreshPrices}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh prices
          </button>
          <button
            onClick={() => setPrivacyMode((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors font-medium ${
              privacyMode
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {privacyMode ? "% mode" : "₹ mode"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === "transactions" && transactions.length > 0 && (
              <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {transactions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && (
        <Dashboard
          data={data}
          livePrices={livePrices}
          liveFX={market?.fx ?? null}
          inflation={market?.inflation ?? null}
          hide={privacyMode}
          onDataChange={handleDataChange}
        />
      )}

      {activeTab === "transactions" && (
        <TransactionsTab
          transactions={transactions}
          realizedTrades={realizedTrades}
          hide={privacyMode}
          usdinr={usdinr}
        />
      )}

      {activeTab === "analytics" && (
        <AnalyticsTab
          data={data}
          transactions={transactions}
          realizedTrades={realizedTrades}
          historyData={historyData}
          loadingHistory={loadingHistory}
          livePrices={livePrices}
          liveFX={market?.fx ?? null}
          hide={privacyMode}
        />
      )}

      {activeTab === "data" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <ExcelUpload
            dataSource={dataSource}
            onUpload={handleExcelUpload}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
