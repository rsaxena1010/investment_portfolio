import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const FILE = path.resolve(process.cwd(), "portfolio_holdings_master.json");

export async function GET() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "Failed to read holdings", detail: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action !== "update") return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });

    const { section = "equities", symbol, payload } = body as { section?: string; symbol: string; payload: any };
    if (!symbol) return NextResponse.json({ ok: false, error: "missing symbol" }, { status: 400 });

    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw);

    if (!data[section]) data[section] = {};
    const existing = data[section][symbol] ?? {};
    // apply updates only for provided keys (null means delete)
    for (const k of Object.keys(payload ?? {})) {
      const v = payload[k];
      if (v === null) {
        delete existing[k];
      } else {
        existing[k] = v;
      }
    }
    data[section][symbol] = existing;
    if (!data.metadata) data.metadata = {};
    data.metadata.last_update = new Date().toISOString().slice(0, 10);

    // attempt to write back — may fail on serverless/production
    try {
      await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
      return NextResponse.json({ ok: true, persisted: true });
    } catch (we) {
      // still return updated object but indicate non-persistence
      return NextResponse.json({ ok: true, persisted: false, warning: String(we) });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
