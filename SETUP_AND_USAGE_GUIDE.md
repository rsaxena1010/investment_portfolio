# Investment Portfolio Data Integration Guide
## Rahul Saxena | Real-Time Analytics & Monitoring System

---

## 📋 Overview

This system integrates:
1. **Portfolio Holdings Database** - Master list of all US equity, crypto, and inactive positions
2. **Real-Time Data Fetching** - Python tools to pull current prices and historical data
3. **Technical Analysis Framework** - SPDF (Saxena Portfolio Decision Framework) for execution timing
4. **Interactive Dashboard** - HTML interface for monitoring and decision-making
5. **Alpha Vantage API** - Free tier stock data integration

**Status:** Initialized and ready for daily monitoring

---

## 🗂️ Files Created

### Core Data Files
1. **portfolio_holdings_master.json** - Master holdings database with all positions, costs, and thesis
2. **portfolio_tracker.csv** - Quick reference table (Excel-compatible)
3. **portfolio_monitoring_plan.json** - SPDF framework and trigger definitions

### Analysis Tools
1. **portfolio_data_fetcher.py** - Python script for data integration
2. **portfolio_dashboard.html** - Interactive web interface for monitoring

### Documentation
1. **SETUP_AND_USAGE_GUIDE.md** - This file
2. **daily_monitoring_report_template.json** - Template for daily updates

---

## 🔧 Setup Instructions

### Step 1: Install Required Libraries

```bash
pip install yfinance requests openpyxl pandas
```

**Why these libraries?**
- **yfinance**: Free, no API key needed, reliable stock data
- **requests**: HTTP requests for API calls
- **openpyxl**: Excel file manipulation
- **pandas**: Data analysis and CSV handling

### Step 2: Alpha Vantage API Configuration

Your API Key: `COTBD7WHID7LASF4`

**Free Tier Limits:**
- 5 requests per minute
- 500 requests per day
- Daily aggregate bars: Limited
- Technical indicators: Limited

**API Endpoints Available:**
- `GLOBAL_QUOTE` - Current price and daily change
- `TIME_SERIES_DAILY` - Historical daily OHLCV data
- `TIME_SERIES_INTRADAY` - Intraday data (not recommended for daily monitoring)
- `RSI`, `SMA`, `MACD`, `ATR` - Technical indicators

**Documentation:** https://www.alphavantage.co/documentation/

### Step 3: Run Data Fetcher

```bash
python3 portfolio_data_fetcher.py
```

**Output:**
- Creates snapshot file: `portfolio_snapshot_YYYYMMDD_HHMMSS.json`
- Generates monitoring report template
- Stores all OHLCV data in structured format

### Step 4: Open Dashboard

Open `portfolio_dashboard.html` in your web browser:
- View all holdings
- Monitor active triggers
- Track SPDF signals
- Access key analytics

---

## 📊 Holdings Overview

### Active US Equity Positions (10)

| Symbol | Shares | Avg Cost | Status | Thesis |
|--------|--------:|---------:|--------|--------|
| SNDK | 66 | $1,500.00 | Active | Legacy position — monitor thesis |
| GOOGL | 97 | $370.76 | 🎯 Build | Strongest Mag7, target 2nd pillar |
| ISRG | 36 | $414.36 | Active | Surgical robotics |
| VUAA.L | 200 | $144.86 | Floor | Ireland ETF, long-term template |
| META | 280 | $596.57 | Active | Mag7 diversification |
| CCJ | 35 | $119.33 | Active | Nuclear fuel/energy |
| NVDA | 200 | $189.12 | Active | AI/GPU leader |
| AMZN | 200 | $239.80 | Active | Cloud/retail dominance |
| MSFT | 790 | $435.06 | ⚠️ Monitored | Trim zone $430-440, fund GOOGL |
| SPCE | 175 | $3.24 | 📍 Hold | Delta trials Q3-Q4 2026 |

### Crypto Holdings

| Asset | Quantity | Avg Cost | Thesis |
|-------|--------:|---------:|--------|
| BTC-USD | 1 | $111,200.00 | Macro store-of-value |
| ETH-USD | 3 | $3,308.00 | Smart contract platform |
| XRP-USD | 3,000 | $3.0629 | Payment/utility token |

### Re-Entry Alerts

**IONQ** (Currently 0 shares)
- Re-entry trigger: **$50 or below** with volume confirmation
- Suggested position: 50-75 shares
- Thesis: Q1 2026 revenue +755%, 256-qubit sale, $3B+ cash
- Status: ⚠️ **MONITOR ACTIVELY**

---

## 🎯 SPDF Framework (Saxena Portfolio Decision Framework)

### What is SPDF?

A 4-layer technical analysis framework for **execution timing** (not fundamental decisions). Applied AFTER thesis is confirmed, using daily timeframe data.

### The 4 Layers

```
Layer 1: TREND GATE
├─ 50-day SMA: Price vs short-term trend
├─ 200-day SMA: Price vs long-term trend
└─ Signal: Above both = UPTREND (favor dips)
           Below both = DOWNTREND (avoid buys)

Layer 2: MOMENTUM (RSI + MACD)
├─ RSI(14) <35 in uptrend = BUY ZONE
├─ RSI(14) >70 in any trend = TAKE PROFIT ZONE
└─ MACD crossover = Secondary confirmation

Layer 3: VOLUME (Required for BUYs only)
├─ Signal-day volume >1.3x 20-day average = CONVICTION
├─ Low volume = WAIT
└─ For TRIMS: RSI >70 is sufficient (no volume gate)

Layer 4: VOLATILITY (ATR)
├─ ATR(14) = Stop-loss distance
└─ Position sizing based on volatility
```

### Decision Rules

✅ **BUY** fires only if: Layer 1 + Layer 2 + Layer 3 **ALL align**

📊 **SELLS** always require:
1. Re-entry price provided
2. Catalyst scan before execution
3. Partial exit (not full close) default

---

## 📈 Daily Monitoring Workflow

### Morning (Before Market Open)

```
1. Check overnight news for catalysts
2. Review business news feeds (Reuters, Bloomberg)
3. Note TradingView SPDF signals from previous close
```

### During Market Hours

```
1. Monitor key watchlist prices (MSFT, GOOGL, IONQ, SPCE)
2. Track volume on any signal activations
3. Note any catalyst announcements
```

### After Market Close (Daily)

```
1. Update portfolio_data_fetcher.py
2. Pull latest prices, SMA, RSI, MACD
3. Compare vs. trigger zones
4. Generate daily_monitoring_report
5. Flag any actionable signals for Chandra discussion
```

### Weekly (Friday)

```
1. Consolidate weekly monitoring notes
2. Review portfolio metrics (ROI, concentration, sector)
3. Validate with Chandra Soni (Anand Rathi)
```

### Monthly (End of Month)

```
1. Update portfolio_holdings_master.json with DBS screenshots
2. Reconcile cost basis and market values
3. Calculate portfolio-level ROI
4. Review tax implications and RNOR strategy
```

---

## 🚨 Key Triggers & Alert System

### MSFT Trim Zone
- **Condition:** Price bounces to $430-440
- **Action:** Trim to raise capital
- **Destination:** GOOGL build + dry powder
- **Status:** Currently below zone, monitoring

### GOOGL Build Opportunity
- **Condition:** SPDF uptrend confirmed (above 50/200 SMA, RSI <35)
- **Action:** Scale position from 97 to meaningful 2nd pillar
- **Funded by:** MSFT trim proceeds
- **Status:** Ready, awaiting trigger

### IONQ Re-Entry Alert ⚠️ ACTIVE
- **Condition:** Price dips to $50 or below
- **Volume:** >1.3x 20-day average
- **Action:** Buy 50-75 shares
- **Thesis:** Revenue +755%, 256-qubit sale, $3B+ cash
- **Status:** ⚠️ **CHECK EVERY TRADING DAY**

### SPCE Thesis Hold
- **Condition:** Delta Class spacecraft trials expected Q3-Q4 2026
- **Action:** Hold on price weakness (thesis intact)
- **Do NOT sell on:** General price weakness without catalyst change
- **Status:** Monitor for trial updates

### SPCX (SpaceX ETF) Entry Window
- **IPO Date:** June 12, 2026
- **Entry Timing:** 2-4 weeks post-IPO
- **Expect:** Temporary dips during index rebalancing
- **Action:** Position for dip buying
- **Status:** Watch for ETF launch announcement

---

## 💰 Tax Strategy (Critical for RNOR Status)

### Your Tax Position
- **Status:** RNOR (Resident Not Ordinarily Resident)
- **Period:** FY2025-26 and FY2026-27 (ends March 31, 2027)
- **Foreign Income:** NOT taxable in India during RNOR
- **Window:** High-leverage period for rebalancing without tax drag

### Use RNOR Proactively
✅ Execute rebalancing trades (MSFT trim, GOOGL build)
✅ Realize gains on foreign assets without Indian tax
✅ Optimize portfolio without tax friction
❌ Do NOT use RNOR passively (missed optimization opportunity)

### Post-RNOR Planning (April 2027+)
- Transition to Ireland-domiciled ETFs (e.g., VUAA.L)
- Move to "sit-and-forget" structure
- Minimize capital gains realization

### Action Items
1. ✅ Declare **Old Regime** to Blinkit payroll (HRA exemption is material)
2. ✅ File ITR-2 with Schedule FA by **July 31, 2026**
3. ✅ Validate all actions with CA and Chandra

---

## 📡 API Integration & Data Flow

### Alpha Vantage Flow

```
Your Portfolio
    ↓
portfolio_data_fetcher.py
    ↓
Alpha Vantage API (GLOBAL_QUOTE, TIME_SERIES_DAILY)
    ↓
portfolio_snapshot_YYYYMMDD_HHMMSS.json
    ↓
portfolio_dashboard.html (visualization)
    ↓
TradingView SPDF analysis (manual)
    ↓
Daily Monitoring Report
    ↓
Chandra Soni (Validation)
    ↓
DBS Singapore (Execution)
```

### Rate Limiting Strategy

**Free Tier Limits:** 5 req/min, 500/day

**To avoid hitting limits:**
- Fetch all symbols once per day (after market close)
- Use cached data during market hours
- Spread requests across the day if doing intraday analysis

**Example Daily Schedule:**
```
9:30 AM EST (Market open) - Use cached data only
4:00 PM EST (Market close) - Run full portfolio_data_fetcher.py
Store results in daily snapshot files
Reference snapshot files throughout the day
```

---

## 🚀 Deploying to Vercel & Hosting on GitHub

This project is a Next.js app and can be deployed for free on Vercel. It is already structured for deployment (`next` scripts in `package.json`). Follow these steps:

1. Create a new GitHub repository and push this workspace:

```bash
git init
git add .
git commit -m "Initial portfolio dashboard"
git branch -M main
git remote add origin git@github.com:<your-username>/<repo>.git
git push -u origin main
```

2. Sign in to Vercel (free tier) and import the GitHub repo. Vercel will automatically detect Next.js and set build command to `npm run build` and output to the default.

3. Environment & persistence notes:
- The app reads `portfolio_holdings_master.json` from the repository at runtime. The in-app holdings editor attempts to persist updates back to that file when running locally. On Vercel (serverless), filesystem writes are ephemeral and will not persist across deployments. Two options:
    - Use the editor to edit holdings in the browser (stored in memory/local downloads) and then create a git commit locally to persist changes to the repo.
    - Or configure a GitHub Actions workflow or a small backend (or use a GitHub Personal Access Token) to push changes back to the repository programmatically (not included by default for security reasons).

4. Quick deploy steps on Vercel after import:

```bash
# push changes to GitHub
git add . && git commit -m "Add holdings editor and API" && git push
# Vercel will build automatically once the push completes
```

5. Local testing:

```bash
npm install
npm run dev
# Open http://localhost:3000
```

---

## ✏️ Holdings Editor

I added a simple in-app editor accessible from the Dashboard: click `Edit Holdings` to open the editor. It calls `/api/holdings` to read the current `portfolio_holdings_master.json` and will attempt to write updates back to the file when running locally. On Vercel the write will likely be non-persistent (the API returns `persisted: false` in that case). Use the "Download JSON" button to export the updated holdings and commit them to the repo to persist changes.

---

## 🛠️ Using portfolio_data_fetcher.py

### Quick Start

```python
from portfolio_data_fetcher import PortfolioDataFetcher

# Initialize
fetcher = PortfolioDataFetcher()

# Fetch single symbol
msft_data = fetcher.fetch_yfinance_data("MSFT", period="1y")
print(f"MSFT Current Price: ${msft_data['current_price']:.2f}")
print(f"1-Day Change: {msft_data['1d_change']:.2f}%")

# Apply SPDF framework
spdf_signal = fetcher.apply_spdf_framework("MSFT", msft_data["hist_data"]["Close"])
print(f"Signal: {spdf_signal['spdf_signal']}")

# Generate daily report
report = fetcher.generate_monitoring_report()
```

### Output Files

Each run creates:
- `portfolio_snapshot_20260719_154629.json` - Full market data snapshot
- `daily_monitoring_report_template.json` - Today's report template
- Appended to portfolio history for trend analysis

---

## 📊 Understanding the Dashboard

### Header Stats
- **Portfolio Status:** Active/Paused
- **Last Updated:** Date of last data refresh
- **Tax Status:** RNOR (high-leverage window)
- **Key Advisor:** Chandra Soni (Anand Rathi)

### Holdings Table
- Shows all active positions with shares, average cost, and thesis
- Color-coded by status (Active, Monitored, Build, Hold)
- Click to expand thesis details

### Key Triggers Section
- MSFT Trim Zone
- GOOGL Build Opportunity
- IONQ Re-Entry Alert
- SPCX Entry Window

### SPDF Framework Panel
- Visual explanation of 4 layers
- Decision logic flowchart
- Signal interpretation guide

### Tax Strategy Panel
- RNOR window benefits
- Action items checklist
- Post-RNOR transition plan

### Analytics Charts
- Allocation by asset class
- Sector concentration
- Performance tracking

---

## ✅ Validation Checklist

Before executing ANY trade:

- [ ] Thesis remains intact (catalyst scan)
- [ ] SPDF signal confirmed (all 4 layers)
- [ ] Volume check passed (if buying)
- [ ] Re-entry price provided (if selling)
- [ ] Discussed with Chandra (Anand Rathi)
- [ ] DBS screenshot ready for documentation
- [ ] Tax implications reviewed (RNOR status)
- [ ] Position sizing respects "10 active slots" discipline

---

## 🔄 Continuous Improvement

### Monthly Data Quality Check
```
1. Compare portfolio_holdings_master.json vs. latest DBS screenshot
2. Update cost basis if new trades executed
3. Reconcile market values (account for price changes)
4. Archive monthly snapshot for trend analysis
```

### Quarterly Review
```
1. SPDF accuracy - did signals fire as predicted?
2. Thesis integrity - has anything changed for holdings?
3. New holdings research - should we add to portfolio?
4. Sector concentration - any rebalancing needed?
```

### Seasonality & Market Monitoring
```
1. Q1: Tax planning, ITR filing (July 31 deadline)
2. Q2: Mid-year rebalance, RNOR window check
3. Q3: Earnings season begins, catalyst monitoring
4. Q4: Tax loss harvesting, year-end planning
```

---

## 🎓 Key Learnings & Principles

### Standing Rules (Non-Negotiable)

1. **Anti-Momentum Discipline**
   - No chasing stocks after large moves
   - Applied to INTC, SNDK, FIX in past
   - Core portfolio discipline

2. **Catalyst Scanning Before Sells**
   - Always check upcoming catalysts before exit
   - Learned from SPCE (125%+ surge post-sell), IONQ, QBTS
   - Prevents premature exits

3. **Second-Order Effects**
   - Trace halo effects (e.g., SpaceX IPO → SPCE proxy)
   - Quantum funding affects IONQ/QBTS
   - Watch for correlation triggers

4. **Partial Exits with Runners**
   - Default: Partial close, not full liquidation
   - Always provide re-entry price
   - Keep some position exposed to upside

5. **Self-Funded Rebalancing**
   - Zero-sum within existing book
   - No new external capital assumption
   - MSFT trim → GOOGL build (trim proceeds fund build)

6. **RNOR is Primary Tax Lever**
   - Foreign asset gains NOT taxable during RNOR
   - Use actively for rebalancing
   - Not a passive "do nothing" advantage

---

## 📞 Support & Validation

**Primary Advisor:** Chandra Soni (Anand Rathi)
- Validate all major recommendations
- Discuss entry/exit timing
- Review tax implications

**DBS Singapore**
- Execute trades
- Confirm cost basis
- Maintain screenshots

**CA/Tax Advisor**
- ITR-2 filing (Schedule FA mandatory)
- RNOR status verification
- Tax optimization strategies

---

## 🚀 Next Steps

### Immediate (This Week)
- [ ] Install Python libraries (`pip install yfinance requests openpyxl pandas`)
- [ ] Run portfolio_data_fetcher.py and verify output
- [ ] Open portfolio_dashboard.html in browser
- [ ] Review holdings vs. DBS latest screenshot

### Short Term (This Month)
- [ ] Set up daily monitoring workflow
- [ ] Schedule alpha Vantage data pulls (after market close)
- [ ] Create TradingView SPDF watchlist
- [ ] Discuss MSFT trim zone with Chandra

### Medium Term (Next 3 Months)
- [ ] Monitor IONQ for re-entry dip (<$50)
- [ ] Track MSFT bounce to $430-440
- [ ] Watch SPCE catalyst (Delta trials)
- [ ] Prepare for SPCX entry window
- [ ] Declare Old Regime to Blinkit payroll

### Long Term (Next 12 Months)
- [ ] Prepare post-RNOR transition (April 2027)
- [ ] Build Ireland-domiciled ETF holdings
- [ ] Shift to sit-and-forget structure
- [ ] Evaluate overall portfolio rebalancing

---

## 📝 Document Version

- **Created:** July 19, 2026
- **Last Updated:** July 19, 2026
- **Applies To:** Rahul Saxena Investment Portfolio
- **Status:** Active & Ready for Daily Use

---

**Questions?** Refer to portfolio_monitoring_plan.json for framework details or consult Chandra Soni for trade validation.

Good luck with your portfolio! 📈
