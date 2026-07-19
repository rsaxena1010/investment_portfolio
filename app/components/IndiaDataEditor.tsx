"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import type { PortfolioData } from "../types";

type Tab = "mf" | "property" | "savings" | "cashflows";

interface Props {
  data: PortfolioData;
  onChange: (patch: Partial<PortfolioData>) => void;
  onClose: () => void;
}

function NumInput({ value, onChange, placeholder }: { value: number; onChange: (n: number) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"
      value={value || ""}
      placeholder={placeholder ?? "0"}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function StrInput({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      className="border border-gray-200 rounded px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-indigo-400"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function IndiaDataEditor({ data, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("mf");

  const [mfs, setMfs] = useState(() => data.indiaHoldings.mutualFunds.map((f) => ({ ...f })));
  const [aifs, setAifs] = useState(() => data.indiaHoldings.aif.map((f) => ({ ...f })));
  const [ppfBal, setPpfBal] = useState(data.indiaHoldings.ppf.balance);
  const [ssyBal, setSsyBal] = useState(data.indiaHoldings.ssy.balance);
  const [cashAccs, setCashAccs] = useState(() => data.indiaHoldings.cash.map((c) => ({ ...c })));
  const [properties, setProperties] = useState(() => data.realEstate.map((r) => ({ ...r })));
  const [inflows, setInflows] = useState(() => data.cashflows.inflows.map((f) => ({ ...f })));
  const [outflows, setOutflows] = useState(() => data.cashflows.outflows.map((f) => ({ ...f })));

  const mfInputRef = useRef<HTMLInputElement>(null);
  const [mfUploading, setMfUploading] = useState(false);
  const [mfError, setMfError] = useState<string | null>(null);

  async function handleMFFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls)$/i)) { setMfError("Please upload an .xlsx or .xls file."); return; }
    setMfUploading(true);
    setMfError(null);
    try {
      const buffer = await file.arrayBuffer();
      const { parseMFExcel } = await import("../excelParser");
      const parsed = parseMFExcel(buffer);
      if (parsed.length === 0) setMfError("No funds found. Expected columns: Fund Name, Invested, Current Value");
      else setMfs(parsed);
    } catch (e) {
      setMfError(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setMfUploading(false);
    }
  }

  function saveAll() {
    onChange({
      indiaHoldings: {
        mutualFunds: mfs.filter((f) => f.name),
        aif: aifs.filter((f) => f.name),
        ppf: { ...data.indiaHoldings.ppf, balance: ppfBal },
        ssy: { ...data.indiaHoldings.ssy, balance: ssyBal },
        cash: cashAccs.filter((c) => c.name),
      },
      realEstate: properties.filter((p) => p.name),
      cashflows: {
        inflows: inflows.filter((f) => f.name),
        outflows: outflows.filter((f) => f.name),
      },
    });
    onClose();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "mf", label: "Mutual Funds & AIF" },
    { id: "property", label: "Property" },
    { id: "savings", label: "Savings & Cash" },
    { id: "cashflows", label: "Income & Expenses" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">Edit India Portfolio Data</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex border-b border-gray-100 px-5 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4 max-h-[580px] overflow-y-auto">

        {/* ── Mutual Funds ── */}
        {tab === "mf" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => mfInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {mfUploading ? "Uploading…" : "Upload MF Statement (Excel)"}
              </button>
              <span className="text-xs text-gray-400">Columns needed: Fund Name · Invested · Current Value</span>
              <input ref={mfInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMFFile(f); e.target.value = ""; }} />
            </div>
            {mfError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{mfError}</p>}

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2 text-left">Fund Name</th>
                  <th className="px-3 py-2 text-right w-36">Invested (₹)</th>
                  <th className="px-3 py-2 text-right w-36">Current Value (₹)</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mfs.map((f, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">
                      <StrInput value={f.name} placeholder="Fund name" onChange={(v) => setMfs((p) => p.map((x, j) => j === i ? { ...x, name: v } : x))} />
                    </td>
                    <td className="px-3 py-1.5">
                      <NumInput value={f.invested} onChange={(v) => setMfs((p) => p.map((x, j) => j === i ? { ...x, invested: v } : x))} />
                    </td>
                    <td className="px-3 py-1.5">
                      <NumInput value={f.current} onChange={(v) => setMfs((p) => p.map((x, j) => j === i ? { ...x, current: v } : x))} />
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <button onClick={() => setMfs((p) => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setMfs((p) => [...p, { name: "", invested: 0, current: 0 }])}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
              <Plus className="w-3.5 h-3.5" /> Add Fund
            </button>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">AIF / Alternative Investments</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-right w-36">Invested (₹)</th>
                    <th className="px-3 py-2 text-right w-36">Current Value (₹)</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {aifs.map((f, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">
                        <StrInput value={f.name} placeholder="AIF name" onChange={(v) => setAifs((p) => p.map((x, j) => j === i ? { ...x, name: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5">
                        <NumInput value={f.invested} onChange={(v) => setAifs((p) => p.map((x, j) => j === i ? { ...x, invested: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5">
                        <NumInput value={f.current} onChange={(v) => setAifs((p) => p.map((x, j) => j === i ? { ...x, current: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button onClick={() => setAifs((p) => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setAifs((p) => [...p, { name: "", invested: 0, current: 0 }])}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2">
                <Plus className="w-3.5 h-3.5" /> Add AIF
              </button>
            </div>
          </div>
        )}

        {/* ── Property ── */}
        {tab === "property" && (
          <div className="space-y-3">
            {properties.map((p, i) => (
              <div key={i} className="p-4 border border-gray-100 rounded-lg bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Property {i + 1}</span>
                  <button onClick={() => setProperties((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Property Name</label>
                    <StrInput value={p.name} placeholder="e.g. Apartment — Bangalore"
                      onChange={(v) => setProperties((prev) => prev.map((x, j) => j === i ? { ...x, name: v } : x))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">City</label>
                    <StrInput value={p.city} placeholder="City"
                      onChange={(v) => setProperties((prev) => prev.map((x, j) => j === i ? { ...x, city: v } : x))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Purchase Price (₹)</label>
                    <NumInput value={p.purchasePrice}
                      onChange={(v) => setProperties((prev) => prev.map((x, j) => j === i ? { ...x, purchasePrice: v } : x))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Current Value (₹)</label>
                    <NumInput value={p.currentValue}
                      onChange={(v) => setProperties((prev) => prev.map((x, j) => j === i ? { ...x, currentValue: v } : x))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Monthly Rent (₹)</label>
                    <NumInput value={p.monthlyRent}
                      onChange={(v) => setProperties((prev) => prev.map((x, j) => j === i ? { ...x, monthlyRent: v } : x))} />
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setProperties((p) => [...p, { name: "", city: "", purchasePrice: 0, currentValue: 0, monthlyRent: 0, currency: "INR" }])}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-3.5 h-3.5" /> Add Property
            </button>
          </div>
        )}

        {/* ── Savings & Cash ── */}
        {tab === "savings" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <label className="text-xs font-semibold text-gray-600 mb-2 block">PPF Balance (₹)</label>
                <NumInput value={ppfBal} onChange={setPpfBal} />
              </div>
              <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <label className="text-xs font-semibold text-gray-600 mb-2 block">Sukanya Samriddhi Balance (₹)</label>
                <NumInput value={ssyBal} onChange={setSsyBal} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Bank Accounts & Cash</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Account / Bank Name</th>
                    <th className="px-3 py-2 text-right w-44">Balance (₹)</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cashAccs.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">
                        <StrInput value={c.name} placeholder="e.g. HDFC Savings Account"
                          onChange={(v) => setCashAccs((p) => p.map((x, j) => j === i ? { ...x, name: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5">
                        <NumInput value={c.balance}
                          onChange={(v) => setCashAccs((p) => p.map((x, j) => j === i ? { ...x, balance: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button onClick={() => setCashAccs((p) => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setCashAccs((p) => [...p, { name: "", balance: 0 }])}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mt-2">
                <Plus className="w-3.5 h-3.5" /> Add Account
              </button>
            </div>
          </div>
        )}

        {/* ── Income & Expenses ── */}
        {tab === "cashflows" && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-emerald-700 mb-3 uppercase tracking-wide">Income / Inflows</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-right w-36">Monthly (₹)</th>
                    <th className="px-3 py-2 text-right w-36">Annual (₹)</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inflows.map((f, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">
                        <StrInput value={f.name} placeholder="e.g. Salary"
                          onChange={(v) => setInflows((p) => p.map((x, j) => j === i ? { ...x, name: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5">
                        <NumInput value={Math.round(f.annual / 12)}
                          onChange={(v) => setInflows((p) => p.map((x, j) => j === i ? { ...x, annual: v * 12 } : x))} />
                      </td>
                      <td className="px-3 py-1.5">
                        <NumInput value={f.annual}
                          onChange={(v) => setInflows((p) => p.map((x, j) => j === i ? { ...x, annual: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button onClick={() => setInflows((p) => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setInflows((p) => [...p, { name: "", annual: 0 }])}
                className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 mt-2">
                <Plus className="w-3.5 h-3.5" /> Add Income
              </button>
            </div>

            <div>
              <p className="text-xs font-semibold text-red-600 mb-3 uppercase tracking-wide">Expenses & Outflows</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-right w-36">Monthly (₹)</th>
                    <th className="px-3 py-2 text-right w-36">Annual (₹)</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {outflows.map((f, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5">
                        <StrInput value={f.name} placeholder="e.g. Living Expenses"
                          onChange={(v) => setOutflows((p) => p.map((x, j) => j === i ? { ...x, name: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5">
                        <NumInput value={Math.round(f.annual / 12)}
                          onChange={(v) => setOutflows((p) => p.map((x, j) => j === i ? { ...x, annual: v * 12 } : x))} />
                      </td>
                      <td className="px-3 py-1.5">
                        <NumInput value={f.annual}
                          onChange={(v) => setOutflows((p) => p.map((x, j) => j === i ? { ...x, annual: v } : x))} />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button onClick={() => setOutflows((p) => p.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setOutflows((p) => [...p, { name: "", annual: 0 }])}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 mt-2">
                <Plus className="w-3.5 h-3.5" /> Add Expense
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        <button
          onClick={saveAll}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Save All Changes
        </button>
      </div>
    </div>
  );
}
