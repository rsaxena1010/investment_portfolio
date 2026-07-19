import * as XLSX from "xlsx";
import type { PortfolioData, Transaction } from "./types";

type Row = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

function dateStr(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  return str(v);
}

function sheetToRows(wb: XLSX.WorkBook, ...names: string[]): Row[] {
  for (const name of names) {
    const sheet = wb.Sheets[name];
    if (sheet) return XLSX.utils.sheet_to_json<Row>(sheet, { defval: null, raw: false });
  }
  return [];
}

export function parseExcel(buffer: ArrayBuffer): { data: PortfolioData; transactions: Transaction[] } {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true, raw: false });

  // ── Holdings_India (columns: Name, Category, Invested, Balance) ──
  const indiaRows = sheetToRows(wb, "Holdings_India", "India");
  const mutualFunds = indiaRows
    .filter((r) => str(r.Category).toLowerCase().includes("mf") || str(r.Category).toLowerCase().includes("mutual"))
    .map((r) => ({ name: str(r.Name), invested: num(r.Invested), current: num(r.Balance ?? r.Current) }));
  const aif = indiaRows
    .filter((r) => str(r.Category).toLowerCase().includes("aif"))
    .map((r) => ({ name: str(r.Name), invested: num(r.Invested), current: num(r.Balance ?? r.Current) }));
  const ppfRow = indiaRows.find((r) => str(r.Category).toLowerCase().includes("ppf"));
  const ssyRow = indiaRows.find((r) => str(r.Category).toLowerCase().includes("ssy"));
  const cashRows = indiaRows.filter((r) => {
    const cat = str(r.Category).toLowerCase();
    return cat.includes("cash") || cat.includes("bank") || cat.includes("fd") || cat.includes("savings");
  });

  // ── Holdings_SG (columns: Symbol, Name, Type, Quantity, AvgCost, CurrentPrice, Currency) ──
  const sgRows = sheetToRows(wb, "Holdings_SG", "Singapore", "SG");
  const usEquity = sgRows
    .filter((r) => str(r.Type).toLowerCase().includes("equity") || str(r.Type).toLowerCase().includes("stock"))
    .map((r) => ({
      symbol: str(r.Symbol),
      name: str(r.Name),
      shares: num(r.Quantity ?? r.Shares),
      avgCost: num(r.AvgCost),
      currentPrice: num(r.CurrentPrice),
      currency: str(r.Currency) || "USD",
    }));
  const crypto = sgRows
    .filter((r) => str(r.Type).toLowerCase().includes("crypto"))
    .map((r) => ({
      symbol: str(r.Symbol),
      name: str(r.Name),
      units: num(r.Quantity ?? r.Units),
      avgCost: num(r.AvgCost),
      currentPrice: num(r.CurrentPrice),
      currency: str(r.Currency) || "USD",
    }));

  // ── RealEstate ──
  const reRows = sheetToRows(wb, "RealEstate", "Real Estate");
  const realEstate = reRows.map((r) => ({
    name: str(r.Name),
    city: str(r.City),
    purchasePrice: num(r.PurchasePrice),
    currentValue: num(r.CurrentValue),
    monthlyRent: num(r.MonthlyRent),
    currency: str(r.Currency) || "INR",
  }));

  // ── Cashflows ──
  const cfRows = sheetToRows(wb, "Cashflows", "CashFlows");
  const inflows = cfRows
    .filter((r) => str(r.FlowType ?? r.Type).toLowerCase().includes("in"))
    .map((r) => ({ name: str(r.Name), annual: num(r.Annual) }));
  const outflows = cfRows
    .filter((r) => str(r.FlowType ?? r.Type).toLowerCase().includes("out"))
    .map((r) => ({ name: str(r.Name), annual: num(r.Annual) }));

  // ── Watchlist ──
  const wlRows = sheetToRows(wb, "Watchlist");
  const watchlist = wlRows.map((r) => ({
    name: str(r.Name),
    currentValue: num(r.CurrentValue),
    trigger: num(r.Trigger),
    note: str(r.Note),
  }));

  // ── FxRates ──
  const fxRows = sheetToRows(wb, "FxRates", "FX");
  let USDINR = 84.5, SGDINR = 63.2;
  for (const row of fxRows) {
    const pair = str(row.Pair).toUpperCase();
    if (pair === "USDINR") USDINR = num(row.Rate, USDINR);
    if (pair === "SGDINR") SGDINR = num(row.Rate, SGDINR);
  }

  // ── ESOPs ──
  const esopRows = sheetToRows(wb, "ESOPs", "ESOP");
  const esops = esopRows
    .filter((r) => str(r.Company))
    .map((r) => ({
      company: str(r.Company),
      symbol: str(r.Symbol ?? ""),
      grantDate: str(r.GrantDate ?? r["Grant Date"] ?? ""),
      totalGranted: num(r.TotalGranted ?? r["Total Granted"] ?? 0),
      vested: num(r.Vested ?? 0),
      unvested: num(r.Unvested ?? 0),
      strikePrice: num(r.StrikePrice ?? r["Strike Price"] ?? 0),
      currentPrice: num(r.CurrentPrice ?? r["Current Price"] ?? 0),
      currency: str(r.Currency ?? "INR"),
      taxRate: num(r.TaxRate ?? r["Tax Rate"] ?? 0.40),
    }));

  // ── ChangeLog ──
  const clRows = sheetToRows(wb, "ChangeLog", "Change Log");
  const changeLog = clRows
    .filter((r) => str(r.Timestamp))
    .map((r) => ({ timestamp: str(r.Timestamp), note: str(r.Note ?? "") }));

  // ── Transactions ──
  const txRows = sheetToRows(wb, "Transactions");
  const transactions: Transaction[] = txRows
    .filter((r) => str(r.Symbol) && str(r.Type))
    .map((r) => ({
      date: dateStr(r.Date),
      symbol: str(r.Symbol),
      name: str(r.Name),
      type: (str(r.Type).charAt(0).toUpperCase() + str(r.Type).slice(1).toLowerCase()) as "Buy" | "Sell",
      quantity: num(r.Quantity),
      price: num(r.Price),
      fees: num(r.Fees),
      currency: (str(r.Currency).toUpperCase() || "USD") as "USD" | "INR",
      assetClass: (str(r.AssetClass).toLowerCase() || "equity") as Transaction["assetClass"],
    }));

  const data: PortfolioData = {
    fxRates: { USDINR, SGDINR },
    indiaHoldings: {
      mutualFunds: mutualFunds.length ? mutualFunds : [],
      aif: aif.length ? aif : [],
      ppf: { name: ppfRow ? str(ppfRow.Name) : "PPF", balance: ppfRow ? num(ppfRow.Balance ?? ppfRow.Current) : 0 },
      ssy: { name: ssyRow ? str(ssyRow.Name) : "SSY", balance: ssyRow ? num(ssyRow.Balance ?? ssyRow.Current) : 0 },
      cash: cashRows.map((r) => ({ name: str(r.Name), balance: num(r.Balance ?? r.Current) })),
    },
    singaporeHoldings: { usEquity, crypto },
    realEstate,
    cashflows: { inflows, outflows },
    watchlist,
    esops: esops.length ? esops : [],
    changeLog: changeLog.length ? changeLog : [],
  };

  return { data, transactions };
}

// Generate a downloadable template workbook
export function generateTemplate(): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const addSheet = (name: string, rows: Row[]) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet("Holdings_India", [
    { Name: "CAMS Portfolio", Category: "MF", Invested: 10955684, Balance: 10408800 },
    { Name: "Alteria Capital AIF", Category: "AIF", Invested: 5000000, Balance: 5750000 },
    { Name: "PPF Account", Category: "PPF", Invested: "", Balance: 1250000 },
    { Name: "SSY Account", Category: "SSY", Invested: "", Balance: 450000 },
    { Name: "HDFC Savings", Category: "Cash", Invested: "", Balance: 850000 },
    { Name: "SBI Fixed Deposit", Category: "Cash (FD)", Invested: "", Balance: 2000000 },
  ]);

  addSheet("Holdings_SG", [
    { Symbol: "AAPL", Name: "Apple Inc.", Type: "equity", Quantity: 50, AvgCost: 150, CurrentPrice: 195.89, Currency: "USD" },
    { Symbol: "MSFT", Name: "Microsoft Corp.", Type: "equity", Quantity: 30, AvgCost: 280, CurrentPrice: 415.32, Currency: "USD" },
    { Symbol: "BTC-USD", Name: "Bitcoin", Type: "crypto", Quantity: 0.5, AvgCost: 42000, CurrentPrice: 68000, Currency: "USD" },
  ]);

  addSheet("RealEstate", [
    { Name: "Apartment — Bangalore", City: "Bangalore", PurchasePrice: 8500000, CurrentValue: 12000000, MonthlyRent: 35000, Currency: "INR" },
  ]);

  addSheet("Transactions", [
    { Date: "2022-01-15", Symbol: "AAPL", Name: "Apple Inc.", Type: "Buy", Quantity: 50, Price: 150, Fees: 5, Currency: "USD", AssetClass: "equity" },
    { Date: "2023-06-10", Symbol: "MSFT", Name: "Microsoft Corp.", Type: "Buy", Quantity: 30, Price: 280, Fees: 5, Currency: "USD", AssetClass: "equity" },
    { Date: "2024-03-01", Symbol: "AAPL", Name: "Apple Inc.", Type: "Sell", Quantity: 10, Price: 185, Fees: 3, Currency: "USD", AssetClass: "equity" },
  ]);

  addSheet("Cashflows", [
    { Name: "Salary (India)", FlowType: "Inflow", Annual: 3600000 },
    { Name: "Rental Income", FlowType: "Inflow", Annual: 420000 },
    { Name: "Living Expenses", FlowType: "Outflow", Annual: 1800000 },
    { Name: "EMI — Home Loan", FlowType: "Outflow", Annual: 480000 },
  ]);

  addSheet("Watchlist", [
    { Name: "Gold ETF", CurrentValue: 6800, Trigger: 7200, Note: "Buy on breakout above ₹7,200" },
    { Name: "BTC", CurrentValue: 68000, Trigger: 80000, Note: "Take partial profit at $80,000" },
  ]);

  addSheet("FxRates", [
    { Pair: "USDINR", Rate: 84.5 },
    { Pair: "SGDINR", Rate: 63.2 },
  ]);

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

// ── Parse a mutual-fund-only Excel upload ─────────────────────────────────────
// Accepts flexible column names: Fund Name / Scheme Name / Name
//                                Invested / Amount Invested / Cost / Purchase Value
//                                Current Value / Market Value / Value / Balance
export function parseMFExcel(buffer: ArrayBuffer): Array<{ name: string; invested: number; current: number }> {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true, raw: false });
  const sheetName =
    ["MutualFunds", "Mutual Funds", "MF", "Funds", "Portfolio", "Sheet1", "Sheet2"].find(
      (n) => wb.Sheets[n]
    ) ?? wb.SheetNames[0];
  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheetName], { defval: null, raw: false });
  return rows
    .map((r) => ({
      name: str(r["Fund Name"] ?? r["Scheme Name"] ?? r["Scheme"] ?? r["Name"] ?? r["Fund"] ?? ""),
      invested: num(
        r["Invested"] ?? r["Amount Invested"] ?? r["Cost"] ?? r["Purchase Value"] ??
        r["Net Invested"] ?? r["Invested Amount"] ?? 0
      ),
      current: num(
        r["Current Value"] ?? r["Value"] ?? r["Market Value"] ?? r["Balance"] ??
        r["Present Value"] ?? r["Current"] ?? 0
      ),
    }))
    .filter((f) => f.name);
}

// ── Export full portfolio as a multi-sheet Excel ───────────────────────────────
export function exportPortfolioToExcel(
  data: PortfolioData,
  transactions: Transaction[],
  livePrices: Record<string, number> = {}
): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  const addSheet = (name: string, rows: Row[]) => {
    if (rows.length === 0) return;
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  };

  // MutualFunds — dedicated tab for easy re-upload
  addSheet(
    "MutualFunds",
    data.indiaHoldings.mutualFunds.map((f) => ({
      "Fund Name": f.name,
      Invested: f.invested,
      "Current Value": f.current,
      "Gain/Loss": f.current - f.invested,
      "Return %": f.invested > 0 ? +((f.current - f.invested) / f.invested * 100).toFixed(2) : 0,
    }))
  );

  // Holdings_India
  addSheet("Holdings_India", [
    ...data.indiaHoldings.mutualFunds.map((f) => ({ Name: f.name, Category: "MF", Invested: f.invested, Balance: f.current })),
    ...data.indiaHoldings.aif.map((f) => ({ Name: f.name, Category: "AIF", Invested: f.invested, Balance: f.current })),
    { Name: data.indiaHoldings.ppf.name, Category: "PPF", Invested: "", Balance: data.indiaHoldings.ppf.balance },
    { Name: data.indiaHoldings.ssy.name, Category: "SSY", Invested: "", Balance: data.indiaHoldings.ssy.balance },
    ...data.indiaHoldings.cash.map((c) => ({ Name: c.name, Category: "Cash", Invested: "", Balance: c.balance })),
  ]);

  // Holdings_SG
  addSheet("Holdings_SG", [
    ...data.singaporeHoldings.usEquity.map((e) => ({
      Symbol: e.symbol, Name: e.name, Type: "equity",
      Quantity: e.shares, AvgCost: e.avgCost,
      CurrentPrice: livePrices[e.symbol] ?? e.currentPrice,
      Currency: e.currency,
    })),
    ...data.singaporeHoldings.crypto.map((c) => ({
      Symbol: c.symbol, Name: c.name, Type: "crypto",
      Quantity: c.units, AvgCost: c.avgCost,
      CurrentPrice: livePrices[c.symbol] ?? c.currentPrice,
      Currency: c.currency,
    })),
  ]);

  // RealEstate
  addSheet("RealEstate", data.realEstate.map((r) => ({
    Name: r.name, City: r.city,
    PurchasePrice: r.purchasePrice, CurrentValue: r.currentValue,
    MonthlyRent: r.monthlyRent, AnnualRent: r.monthlyRent * 12,
    Currency: r.currency,
  })));

  // Cashflows
  addSheet("Cashflows", [
    ...data.cashflows.inflows.map((f) => ({ Name: f.name, FlowType: "Inflow", Annual: f.annual, Monthly: Math.round(f.annual / 12) })),
    ...data.cashflows.outflows.map((f) => ({ Name: f.name, FlowType: "Outflow", Annual: f.annual, Monthly: Math.round(f.annual / 12) })),
  ]);

  // FxRates
  addSheet("FxRates", [
    { Pair: "USDINR", Rate: data.fxRates.USDINR },
    { Pair: "SGDINR", Rate: data.fxRates.SGDINR },
  ]);

  // ESOPs
  if ((data.esops ?? []).length > 0) {
    addSheet("ESOPs", (data.esops ?? []).map((e) => {
      const grossPerShare = Math.max(0, e.currentPrice - e.strikePrice);
      const vestedGross = e.vested * grossPerShare;
      const taxAmt = vestedGross * e.taxRate;
      return {
        Company: e.company, Symbol: e.symbol ?? "", GrantDate: e.grantDate,
        TotalGranted: e.totalGranted, Vested: e.vested, Unvested: e.unvested,
        StrikePrice: e.strikePrice, CurrentPrice: e.currentPrice,
        Currency: e.currency, TaxRate: e.taxRate,
        VestedGrossGain: vestedGross, TaxLiability: taxAmt,
        VestedNetGain: vestedGross - taxAmt,
      };
    }));
  }

  // ChangeLog
  const exportLog = [
    ...(data.changeLog ?? []),
    { timestamp: new Date().toISOString(), note: "Excel exported" },
  ];
  addSheet("ChangeLog", exportLog.map((e) => ({ Timestamp: e.timestamp, Note: e.note })));

  // Transactions
  if (transactions.length > 0) {
    addSheet("Transactions", transactions.map((t) => ({
      Date: t.date, Symbol: t.symbol, Name: t.name, Type: t.type,
      Quantity: t.quantity, Price: t.price, Fees: t.fees,
      Currency: t.currency, AssetClass: t.assetClass,
    })));
  }

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export interface RealizedTrade {
  symbol: string;
  buyDate: string;
  sellDate: string;
  holdingDays: number;
  taxCategory: "LTCG" | "STCG";
  qty: number;
  buyPrice: number;
  sellPrice: number;
  returnPct: number;
  pnl: number;
  currency: "USD" | "INR";
}

export function computeFIFO(transactions: Transaction[]): RealizedTrade[] {
  const lots: Record<string, Array<{ price: number; qty: number; date: string; currency: "USD" | "INR" }>> = {};
  const realized: RealizedTrade[] = [];

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of sorted) {
    if (tx.type === "Buy") {
      if (!lots[tx.symbol]) lots[tx.symbol] = [];
      lots[tx.symbol].push({ price: tx.price, qty: tx.quantity, date: tx.date, currency: tx.currency });
    } else if (tx.type === "Sell") {
      let remaining = tx.quantity;
      const queue = lots[tx.symbol] ?? [];
      while (remaining > 0 && queue.length > 0) {
        const lot = queue[0];
        const matched = Math.min(remaining, lot.qty);
        const holdingDays = Math.floor(
          (new Date(tx.date).getTime() - new Date(lot.date).getTime()) / 86400000
        );
        realized.push({
          symbol: tx.symbol,
          buyDate: lot.date,
          sellDate: tx.date,
          holdingDays,
          taxCategory: holdingDays > 365 ? "LTCG" : "STCG",
          qty: matched,
          buyPrice: lot.price,
          sellPrice: tx.price,
          returnPct: ((tx.price - lot.price) / lot.price) * 100,
          pnl: matched * (tx.price - lot.price),
          currency: tx.currency,
        });
        lot.qty -= matched;
        remaining -= matched;
        if (lot.qty <= 0) queue.shift();
      }
    }
  }

  return realized;
}
