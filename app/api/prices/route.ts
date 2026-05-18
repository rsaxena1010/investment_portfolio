import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols")?.split(",").filter(Boolean) ?? [];
  if (symbols.length === 0) return NextResponse.json({});

  const results: Record<string, number> = {};

  await Promise.allSettled(
    symbols.map(async (sym) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const json = await res.json();
        const price: number | undefined = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (typeof price === "number") results[sym] = price;
      } catch {
        // skip failed symbols
      }
    })
  );

  return NextResponse.json(results);
}
