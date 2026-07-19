import { NextRequest, NextResponse } from "next/server";

type PricePoint = { date: string; price: number };

async function fetchHistory(symbol: string, range: string): Promise<PricePoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];
    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    const points: PricePoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const price = closes[i];
      if (typeof price === "number" && price > 0) {
        const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
        points.push({ date, price });
      }
    }
    return points;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  const range = req.nextUrl.searchParams.get("range") ?? "5y";
  if (symbols.length === 0) return NextResponse.json({});

  const results = await Promise.allSettled(
    symbols.map(async (sym) => ({ sym, points: await fetchHistory(sym, range) }))
  );

  const out: Record<string, PricePoint[]> = {};
  for (const r of results) {
    if (r.status === "fulfilled") out[r.value.sym] = r.value.points;
  }
  return NextResponse.json(out);
}
