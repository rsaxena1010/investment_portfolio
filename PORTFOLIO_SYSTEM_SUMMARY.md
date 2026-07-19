# 🎯 Investment Portfolio Data Integration System
## Complete Setup Summary for Rahul Saxena

**Date Created:** July 19, 2026  
**Status:** ✅ Ready for Daily Use  
**Last Updated:** July 19, 2026

---

## 📦 System Components

### 1. **Core Data Files** (3 files)
```
portfolio_holdings_master.json        Master database of all positions
portfolio_tracker.csv                 Quick reference table (Excel-compatible)
portfolio_monitoring_plan.json        SPDF framework and trigger definitions
```

**Key Info Stored:**
- 13 active US equity positions
- 3 crypto holdings (BTC, ETH, XRP)
- 1 inactive position (IONQ - re-entry alert)
- Cost basis and market thesis for each position
- 4-layer SPDF technical analysis framework

### 2. **Analysis & Automation Tools** (2 files)
```
portfolio_data_fetcher.py             Real-time data integration tool
daily_monitoring_generator.py         Automated daily alert system
```

**What They Do:**
- Fetch live prices from yfinance (no API key needed)
- Calculate technical indicators (SMA, RSI, MACD, ATR)
- Apply SPDF framework to generate signals
- Generate actionable daily reports
- Track key triggers (MSFT trim, GOOGL build, IONQ re-entry)

### 3. **Dashboard & Visualization**
```
portfolio_dashboard.html              Interactive web interface
```

**Features:**
- Real-time holdings overview
- Active trigger monitoring
- SPDF framework explanation
- Tax strategy dashboard
- Performance analytics with charts
- Actionable next steps

### 4. **Documentation** (2 files)
```
SETUP_AND_USAGE_GUIDE.md             Complete setup and daily workflow guide
PORTFOLIO_SYSTEM_SUMMARY.md          This file - quick reference
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Libraries
```bash
pip install yfinance requests openpyxl pandas
```

### Step 2: Run Data Fetcher
```bash
python3 portfolio_data_fetcher.py
```

### Step 3: Open Dashboard
Open `portfolio_dashboard.html` in your web browser

### Step 4: Generate Daily Report
```bash
python3 daily_monitoring_generator.py
```

**Output:** `daily_report_YYYYMMDD_HHMMSS.json` + console summary

---

## 📊 Holdings Overview (13 Active Positions)

| Symbol | Shares | Avg Cost | Thesis | Status |
|--------|--------|----------|--------|--------|
| **MSFT** | 1,045 | $442.37 | Mag7, Trim $430-440 | ⚠️ Monitored |
| **GOOGL** | 97 | $370.76 | Build 2nd pillar | 🎯 Target |
| **META** | 280 | $596.57 | Mag7 diversification | ✅ Active |
| **NVDA** | 200 | $189.12 | AI/GPU leader | ✅ Active |
| **AMZN** | 200 | $239.80 | Cloud dominance | ✅ Active |
| **AVGO** | 105 | $342.15 | Semiconductor infra | ✅ Active |
| **SPCE** | 175 | $3.24 | Delta trials Q3-Q4 | 📍 Hold |
| **ONTO** | 68 | $255.24 | Oncology biotech | ✅ Active |
| **TSM** | 39 | $388.00 | Foundry player | ✅ Active |
| **ISRG** | 36 | $414.36 | Surgical robotics | ✅ Active |
| **CCJ** | 35 | $119.33 | Nuclear/energy | ✅ Active |
| **QBTS** | 25 | $20.88 | Quantum computing | ✅ Active |
| **VUAA.L** | 200 | $144.86 | Ireland ETF floor | 🔧 Structural |

**Crypto:** BTC (1), ETH (3), XRP (3,000)

**Re-Entry Alert:** IONQ (0 shares) - Trigger: $50 or below with volume

---

## 🎯 Key Triggers & Watchlist

### 🚨 ACTIVE TRIGGERS

#### 1. MSFT Trim Zone ($430-440)
- **Current Status:** Monitoring (currently $442.37 avg, above zone)
- **Action:** Sell 200-300 shares when price bounces to $430-440
- **Purpose:** Raise capital for GOOGL build + dry powder
- **Validation:** Discuss with Chandra before execution

#### 2. GOOGL Build Opportunity
- **Trigger:** SPDF uptrend confirmed (price above 50/200 SMA, RSI <35)
- **Current Holdings:** 97 shares
- **Target:** Meaningful 2nd pillar (likely 200+ shares)
- **Funding:** MSFT trim proceeds
- **Thesis:** Strongest Mag7 trend

#### 3. IONQ Re-Entry Alert ⚠️ ACTIVE
- **Trigger:** Price $50 or below
- **Entry Range:** $48-52 optimal
- **Volume Gate:** >1.3x 20-day average required
- **Position Size:** 50-75 shares
- **Thesis:** Q1 2026 revenue +755%, 256-qubit sale, $3B+ cash
- **Status:** ⚠️ **CHECK DAILY**

#### 4. SPCE Thesis Hold
- **Thesis:** Delta Class spacecraft trials expected Q3-Q4 2026
- **Rule:** Hold on price weakness alone (thesis intact)
- **Do NOT:** Panic sell on general market dips
- **Action:** Monitor for trial announcements

#### 5. SPCX (SpaceX ETF) Entry Window
- **IPO Date:** June 12, 2026
- **Entry Timing:** 2-4 weeks post-IPO
- **Expected:** Temporary dips during index rebalancing
- **Action:** Prepare for dip buying opportunity

---

## 📈 SPDF Framework (Technical Analysis)

**What:** 4-layer daily technical framework for execution timing  
**When:** Apply AFTER fundamental thesis is confirmed  
**Not:** A fundamental analysis tool (replaces investor conviction)

### The 4 Layers

```
LAYER 1: TREND GATE (50-day & 200-day SMA)
├─ Signal: Price above both = UPTREND (favor dips)
│          Price below both = DOWNTREND (avoid buys)
└─ Purpose: Confirm direction before executing

LAYER 2: MOMENTUM (RSI + MACD)
├─ RSI < 35 in uptrend = BUY ZONE (attractive entry)
├─ RSI > 70 in any trend = SELL ZONE (take profit)
└─ MACD crossover = Secondary confirmation

LAYER 3: VOLUME (For BUYs only)
├─ Signal volume > 1.3x 20-day average = CONVICTION
├─ Low volume = WAIT for better setup
└─ For SELLS: RSI >70 is sufficient (no volume gate)

LAYER 4: VOLATILITY (ATR)
├─ ATR(14) = Stop-loss distance
└─ Position sizing based on volatility
```

### Decision Logic

✅ **BUY** fires only if: Layer 1 + Layer 2 + Layer 3 **ALL align**

📊 **SELLS** always require:
1. Re-entry price provided
2. Catalyst scan before execution
3. Partial exit default (not full close)

---

## 💰 Tax Strategy (RNOR Window)

### Current Status
- **RNOR Period:** FY2025-26 & FY2026-27 (ends March 31, 2027)
- **Remaining Days:** ~250 days from July 19, 2026
- **Key Benefit:** Foreign-sourced income (US equities, crypto) **NOT taxable in India**

### Use RNOR Proactively
✅ Execute rebalancing trades (MSFT trim → GOOGL build)  
✅ Realize gains without Indian tax drag  
✅ Optimize portfolio structure  
❌ Don't use passively (missed opportunity cost)

### Urgent Action Items
- [ ] Declare **Old Regime** to Blinkit payroll (HRA exemption is material)
- [ ] File **ITR-2 with Schedule FA** by July 31, 2026
- [ ] Resume **PPF contributions** for FY2026-27
- [ ] Validate all with CA and Chandra Soni

### Post-RNOR Planning (April 2027+)
- Transition to Ireland-domiciled ETFs (VUAA.L template)
- Move to "sit-and-forget" structure
- Minimize capital gains realization

---

## 🔄 Daily Monitoring Workflow

### After Market Close (15 minutes)
```
1. Run: python3 daily_monitoring_generator.py
2. Review generated JSON report + console summary
3. Flag any HIGH severity items
4. Update spreadsheet with new prices
```

### During Market Hours (5 minutes)
```
1. Monitor key watchlist (MSFT, GOOGL, IONQ, SPCE)
2. Check news for catalyst announcements
3. Track volume on any signal activations
4. Use cached data (don't hit API limits)
```

### Weekly Review (30 minutes)
```
1. Consolidate weekly monitoring notes
2. Review portfolio metrics
3. Validate signals with Chandra
4. Plan any execution for following week
```

### Monthly Deep Dive (1 hour)
```
1. Update holdings_master.json from DBS screenshots
2. Reconcile cost basis and market values
3. Calculate portfolio-level ROI
4. Review tax implications
5. Plan next month's monitoring
```

---

## 📡 Data Sources & API Integration

### Primary: yfinance (Recommended)
- ✅ Free, no API key needed
- ✅ Reliable stock data (OHLCV, splits, dividends)
- ✅ No rate limits
- ✅ Used in portfolio_data_fetcher.py

### Secondary: Alpha Vantage API
- 🔑 Your API Key: `COTBD7WHID7LASF4`
- ⏱️ Free tier: 5 req/min, 500 req/day
- 📊 Available endpoints: GLOBAL_QUOTE, TIME_SERIES_DAILY, RSI, SMA, MACD, ATR
- 📖 Docs: https://www.alphavantage.co/documentation/

### Strategy to Avoid Rate Limits
- Fetch all symbols once per day (after market close)
- Store results in daily snapshot files
- Reference cached data during market hours
- Spread requests if doing intraday analysis

---

## 📞 Validation & Support

### Primary Advisor
**Chandra Soni** (Anand Rathi)
- Validate all major recommendations
- Discuss entry/exit timing
- Review tax implications
- **Rule:** No trade execution without Chandra discussion

### DBS Singapore
- Execute trades
- Confirm cost basis
- Maintain screenshots
- Document all positions

### Tax/CA Support
- ITR-2 filing with Schedule FA
- RNOR status verification
- Tax optimization strategies

---

## ✅ Validation Checklist (Before Any Trade)

- [ ] **Thesis:** Remains intact? (catalyst scan)
- [ ] **SPDF Signal:** All 4 layers confirmed?
- [ ] **Volume:** Passed if buying? (>1.3x 20-day avg)
- [ ] **Re-Entry Price:** Provided if selling?
- [ ] **Advisor:** Discussed with Chandra?
- [ ] **Documentation:** DBS screenshot ready?
- [ ] **Tax:** Implications reviewed (RNOR status)?
- [ ] **Position:** Respects 10-slot active discipline?

---

## 🎓 Standing Rules (Non-Negotiable)

1. **Anti-Momentum Discipline** - No chasing large moves (INTC, SNDK, FIX all passed)
2. **Catalyst Scan Before Sells** - Learned from SPCE (+125% post-sell), IONQ, QBTS
3. **Second-Order Effects** - Trace halo effects (SpaceX IPO → SPCE proxy)
4. **Partial Exits** - Default to partial close, provide re-entry price
5. **Self-Funded Rebalancing** - Zero-sum within book, no new capital
6. **RNOR is Active Tool** - Use proactively, not passively
7. **10-Slot Active Discipline** - Consolidated portfolio structure

---

## 📂 File Locations

All files created in: `/mnt/user-data/outputs/`

```
📦 Portfolio System
├── 📄 Core Data
│   ├── portfolio_holdings_master.json
│   ├── portfolio_tracker.csv
│   └── portfolio_monitoring_plan.json
│
├── 🐍 Python Tools
│   ├── portfolio_data_fetcher.py
│   └── daily_monitoring_generator.py
│
├── 🌐 Web Dashboard
│   └── portfolio_dashboard.html
│
├── 📚 Documentation
│   ├── SETUP_AND_USAGE_GUIDE.md
│   └── PORTFOLIO_SYSTEM_SUMMARY.md
│
├── 📊 Reports (Auto-Generated)
│   ├── daily_report_YYYYMMDD_HHMMSS.json
│   ├── portfolio_snapshot_YYYYMMDD_HHMMSS.json
│   └── daily_monitoring_report_template.json
│
└── 🗂️ Archive
    └── [Historical snapshots]
```

---

## 🚀 Next Steps

### Today
- [ ] Install yfinance: `pip install yfinance requests openpyxl pandas`
- [ ] Run `portfolio_data_fetcher.py`
- [ ] Open `portfolio_dashboard.html` in browser

### This Week
- [ ] Set up daily monitoring workflow
- [ ] Create TradingView SPDF watchlist
- [ ] Schedule daily_monitoring_generator.py runs
- [ ] Discuss MSFT trim zone with Chandra

### This Month
- [ ] Monitor IONQ for dip below $50
- [ ] Declare Old Regime to Blinkit payroll
- [ ] File ITR-2 with Schedule FA
- [ ] Resume PPF contributions

### This Quarter
- [ ] Track SPCE catalyst (Delta trials)
- [ ] Watch SPCX ETF launch (2-4 weeks post-IPO)
- [ ] Execute MSFT trim when bounce confirms
- [ ] Build GOOGL position with trim proceeds

### This Year
- [ ] Complete RNOR window optimization
- [ ] Prepare post-RNOR transition plan
- [ ] Build Ireland-domiciled ETF holdings
- [ ] Shift to sit-and-forget structure (2027+)

---

## 📞 Quick Reference

| Item | Details |
|------|---------|
| **API Key** | COTBD7WHID7LASF4 |
| **Primary Advisor** | Chandra Soni (Anand Rathi) |
| **Broker** | DBS Singapore |
| **Tax Status** | RNOR (FY2025-26 & FY2026-27) |
| **RNOR End Date** | March 31, 2027 (~250 days) |
| **ITR Deadline** | July 31, 2026 |
| **Active Slots** | 10 (10-slot discipline) |
| **Re-Entry Alert** | IONQ @ $50 or below |

---

## 💡 Pro Tips

1. **Daily Snapshot:** Run `daily_monitoring_generator.py` every market close (4 PM EST)
2. **TradingView:** Use charts for SPDF layer confirmation (SMA, RSI, MACD, ATR)
3. **Business News:** Monitor Reuters, Bloomberg for catalysts (SPCE trials, IONQ funding, etc.)
4. **Weekly Sync:** Validate all signals with Chandra before executing
5. **Tax Leverage:** Use RNOR aggressively for rebalancing (6+ months remaining)
6. **Dry Powder:** Keep MSFT trim proceeds as dry powder (no FOMO reinvestment)

---

## ✨ What Makes This System Powerful

✅ **Real-Time Data** - Live price feeds from multiple sources  
✅ **Automated Alerts** - Daily trigger checks & actionable reports  
✅ **Technical Framework** - SPDF ensures disciplined execution timing  
✅ **Tax Optimization** - Leverages RNOR window for gain realization  
✅ **Risk Management** - Standing rules prevent emotional decisions  
✅ **Advisor Integration** - Built-in validation workflow with Chandra  
✅ **Documentation** - Audit trail for all decisions and actions  
✅ **Scalability** - Easily add new holdings to the database  

---

## 📝 Document Control

- **Version:** 1.0 (July 19, 2026)
- **Status:** Production Ready
- **Author:** Portfolio Automation System
- **Last Review:** July 19, 2026
- **Next Review:** July 31, 2026 (post-ITR filing)

---

**Happy investing! 🚀**

Questions? Refer to SETUP_AND_USAGE_GUIDE.md or consult Chandra Soni for trade validation.
