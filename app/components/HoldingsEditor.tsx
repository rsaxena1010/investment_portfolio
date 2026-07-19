"use client";

import React, { useEffect, useState } from "react";

type Equity = { shares?: number; avg_cost?: number; [k: string]: any };
type Holdings = { equities: Record<string, Equity>; crypto?: Record<string, any> };

export default function HoldingsEditor() {
  const [holdings, setHoldings] = useState<Holdings | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [shares, setShares] = useState<string>("");
  const [avgCost, setAvgCost] = useState<string>("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/holdings");
        const json = await res.json();
        setHoldings(json);
        const first = Object.keys(json.equities ?? {})[0] ?? null;
        setSelected(first);
      } catch (e) {
        setStatus("Failed to load holdings");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selected || !holdings) return;
    const v = holdings.equities[selected];
    setShares(v?.shares?.toString() ?? "");
    setAvgCost(v?.avg_cost?.toString() ?? "");
  }, [selected, holdings]);

  async function save() {
    if (!selected) return;
    setStatus("Saving...");
    try {
      const payload = {
        action: "update",
        section: "equities",
        symbol: selected,
        payload: { shares: shares === "" ? null : Number(shares), avg_cost: avgCost === "" ? null : Number(avgCost) },
      };
      const res = await fetch("/api/holdings", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } });
      const j = await res.json();
      if (res.ok && j.ok) {
        setStatus("Saved — refreshed from server");
        // refresh
        const r2 = await fetch("/api/holdings");
        setHoldings(await r2.json());
      } else {
        setStatus(j?.error ?? "Save failed");
      }
    } catch (e) {
      setStatus(String(e));
    }
  }

  if (!holdings) return <div className="text-sm text-gray-500">Loading holdings…</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-xs text-gray-600">Symbol</label>
        <select className="border px-2 py-1 rounded" value={selected ?? ""} onChange={(e) => setSelected(e.target.value)}>
          {Object.keys(holdings.equities).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button className="ml-auto text-xs text-blue-600" onClick={() => {
          const blob = new Blob([JSON.stringify(holdings, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = 'portfolio_holdings_master.json'; a.click(); URL.revokeObjectURL(url);
        }}>Download JSON</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Shares / Qty</label>
          <input className="w-full border px-2 py-1 rounded" value={shares} onChange={(e) => setShares(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Avg Cost (USD)</label>
          <input className="w-full border px-2 py-1 rounded" value={avgCost} onChange={(e) => setAvgCost(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="bg-emerald-600 text-white px-3 py-1 rounded text-sm" onClick={save}>Save</button>
        <span className="text-sm text-gray-500">{status}</span>
      </div>
    </div>
  );
}
