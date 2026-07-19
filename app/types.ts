export interface MutualFund { name: string; invested: number; current: number }
export interface AIF { name: string; invested: number; current: number }
export interface PPF { name: string; balance: number }
export interface SSY { name: string; balance: number }
export interface CashAccount { name: string; balance: number }
export interface USEquity { symbol: string; name: string; shares: number; avgCost: number; currentPrice: number; currency: string }
export interface Crypto { symbol: string; name: string; units: number; avgCost: number; currentPrice: number; currency: string }
export interface RealEstate { name: string; city: string; purchasePrice: number; currentValue: number; monthlyRent: number; currency: string }
export interface Cashflow { name: string; annual: number }
export interface WatchlistItem { name: string; currentValue: number; trigger: number; note: string }

export interface EsopGrant {
  company: string;
  symbol?: string;
  grantDate: string;
  totalGranted: number;
  vested: number;
  unvested: number;
  strikePrice: number;
  currentPrice: number;
  currency: string;
  taxRate: number;
}

export interface ChangeLogEntry {
  timestamp: string;
  note: string;
}

export interface PortfolioData {
  fxRates: { USDINR: number; SGDINR: number };
  indiaHoldings: {
    mutualFunds: MutualFund[];
    aif: AIF[];
    ppf: PPF;
    ssy: SSY;
    cash: CashAccount[];
  };
  singaporeHoldings: {
    usEquity: USEquity[];
    crypto: Crypto[];
  };
  realEstate: RealEstate[];
  cashflows: { inflows: Cashflow[]; outflows: Cashflow[] };
  watchlist: WatchlistItem[];
  esops?: EsopGrant[];
  changeLog?: ChangeLogEntry[];
  lastUpdated?: string;
}

export interface Transaction {
  date: string;
  symbol: string;
  name: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
  fees: number;
  currency: "USD" | "INR";
  assetClass: "equity" | "crypto" | "mf" | "re" | "other";
}

export interface MarketData {
  fx: { USDINR: number | null; SGDINR: number | null };
  inflation: { indiaYoY: number | null; usYoY: number | null };
}
