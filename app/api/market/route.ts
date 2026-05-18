import { NextResponse } from "next/server";

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" ? price : null;
  } catch {
    return null;
  }
}

async function fetchWorldBankInflation(country: string): Promise<number | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${country}/indicator/FP.CPI.TOTL.ZG?format=json&mrv=3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    const entries: Array<{ value: number | null }> = json?.[1];
    if (!Array.isArray(entries)) return null;
    const latest = entries.find((e) => e.value !== null);
    return latest?.value ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const [usdinr, sgdinr, indiaInfl, usInfl] = await Promise.allSettled([
    fetchYahooPrice("USDINR=X"),
    fetchYahooPrice("SGDINR=X"),
    fetchWorldBankInflation("IN"),
    fetchWorldBankInflation("US"),
  ]);

  return NextResponse.json({
    fx: {
      USDINR: usdinr.status === "fulfilled" ? usdinr.value : null,
      SGDINR: sgdinr.status === "fulfilled" ? sgdinr.value : null,
    },
    inflation: {
      indiaYoY: indiaInfl.status === "fulfilled" ? indiaInfl.value : null,
      usYoY: usInfl.status === "fulfilled" ? usInfl.value : null,
    },
  });
}
