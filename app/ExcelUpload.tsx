"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Download, X, FileSpreadsheet } from "lucide-react";
import type { PortfolioData, Transaction } from "./types";

interface Props {
  dataSource: "json" | "excel";
  onUpload: (data: PortfolioData, transactions: Transaction[]) => void;
  onReset: () => void;
}

export default function ExcelUpload({ dataSource, onUpload, onReset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setError("Please upload an .xlsx or .xls file.");
        return;
      }
      setParsing(true);
      setError(null);
      try {
        const buffer = await file.arrayBuffer();
        const { parseExcel } = await import("./excelParser");
        const { data, transactions } = parseExcel(buffer);
        onUpload(data, transactions);
      } catch (e) {
        setError(`Parse error: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setParsing(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const downloadTemplate = useCallback(async () => {
    const { generateTemplate } = await import("./excelParser");
    const buffer = generateTemplate();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Data Source</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {dataSource === "excel" ? "Using uploaded Excel file" : "Using default portfolio-data.json"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
          >
            <Download className="w-3.5 h-3.5" />
            Download template
          </button>
          {dataSource === "excel" && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
              Reset to defaults
            </button>
          )}
        </div>
      </div>

      {dataSource === "excel" ? (
        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <p className="font-medium text-indigo-800">Excel data loaded</p>
            <p className="text-xs text-indigo-600 mt-0.5">Upload a new file to replace, or reset to use the default JSON.</p>
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="ml-auto px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">
            {parsing ? "Parsing…" : "Drop your Excel file here or click to browse"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Supports .xlsx — use the template above for the correct format</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Excel sheet structure</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
          {[
            ["Holdings_India", "Name, Category, Invested, Balance"],
            ["Holdings_SG", "Symbol, Name, Type, Quantity, AvgCost, CurrentPrice, Currency"],
            ["RealEstate", "Name, City, PurchasePrice, CurrentValue, MonthlyRent"],
            ["Transactions", "Date, Symbol, Name, Type, Quantity, Price, Fees, Currency, AssetClass"],
            ["Cashflows", "Name, FlowType, Annual"],
            ["Watchlist", "Name, CurrentValue, Trigger, Note"],
            ["FxRates", "Pair (USDINR/SGDINR), Rate"],
          ].map(([sheet, cols]) => (
            <div key={sheet} className="col-span-1">
              <span className="font-mono text-indigo-600">{sheet}</span>
              <span className="text-gray-400"> — {cols}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
