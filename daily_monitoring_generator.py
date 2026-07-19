#!/usr/bin/env python3
"""
Daily Monitoring Report Generator
Rahul Saxena's Portfolio - Automated Daily Alert & Trigger System
Runs after market close to generate actionable insights
"""

import json
from datetime import datetime, timedelta
import yfinance as yf
from pathlib import Path

class DailyMonitoringReportGenerator:
    def __init__(self):
        self.data_dir = Path("/mnt/user-data/outputs")
        self.holdings = self.load_holdings()
        self.triggers = self.load_triggers()
        self.report = {
            "generated_at": datetime.now().isoformat(),
            "market_date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
            "alerts": [],
            "triggers_fired": [],
            "positions_to_monitor": [],
            "recommendations": [],
            "tax_notes": []
        }

    def load_holdings(self):
        """Load master holdings data"""
        try:
            with open(self.data_dir / "portfolio_holdings_master.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            print("Error: portfolio_holdings_master.json not found")
            return None

    def load_triggers(self):
        """Load trigger definitions"""
        triggers = {
            "MSFT": {
                "type": "TRIM_ZONE",
                "target_price_min": 430,
                "target_price_max": 440,
                "action": "Trim to raise capital for GOOGL build + dry powder",
                "current_holding": 1045
            },
            "GOOGL": {
                "type": "BUILD_OPPORTUNITY",
                "target_entry": "SPDF uptrend",
                "action": "Build from 97 to meaningful 2nd pillar",
                "thesis": "Strongest Mag7 trend, funded by MSFT trim"
            },
            "IONQ": {
                "type": "RE_ENTRY_ALERT",
                "re_entry_trigger": 50.00,
                "re_entry_range": "48-52",
                "suggested_position": "50-75 shares",
                "action": "Buy on dip with volume confirmation",
                "thesis": "Q1 2026 revenue +755%, 256-qubit sale, $3B+ cash",
                "status": "CURRENTLY ZERO SHARES"
            },
            "SPCE": {
                "type": "THESIS_HOLD",
                "thesis": "Delta Class spacecraft trials Q3-Q4 2026",
                "rule": "Hold on price weakness alone (thesis intact)",
                "action": "Monitor for trial updates, don't panic sell",
                "current_holding": 175
            }
        }
        return triggers

    def fetch_stock_data(self, symbol, days=60):
        """Fetch recent stock data"""
        try:
            stock = yf.Ticker(symbol)
            hist = stock.history(period="3mo")
            info = stock.info
            
            if hist.empty:
                return None
            
            closes = hist["Close"].tolist()
            return {
                "symbol": symbol,
                "current_price": closes[-1],
                "previous_close": closes[-2] if len(closes) > 1 else None,
                "52week_high": info.get("fiftyTwoWeekHigh", hist["High"].max()),
                "52week_low": info.get("fiftyTwoWeekLow", hist["Low"].min()),
                "1d_change": ((closes[-1] - closes[-2]) / closes[-2] * 100) if len(closes) > 1 else 0,
                "hist_prices": closes
            }
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            return None

    def calculate_sma(self, prices, window):
        """Calculate SMA"""
        if len(prices) < window:
            return None
        return sum(prices[-window:]) / window

    def check_msft_trim_zone(self):
        """Check if MSFT is in trim zone ($430-440)"""
        data = self.fetch_stock_data("MSFT")
        if not data:
            return None

        price = data["current_price"]
        target_min = 430
        target_max = 440

        alert = {
            "symbol": "MSFT",
            "type": "TRIM_ZONE_CHECK",
            "current_price": f"${price:.2f}",
            "target_zone": f"${target_min}-${target_max}",
            "status": "IN_ZONE" if target_min <= price <= target_max else "OUT_OF_ZONE",
            "1d_change": f"{data['1d_change']:.2f}%"
        }

        if target_min <= price <= target_max:
            alert["action"] = "EXECUTE TRIM - Prepare to sell 200-300 shares"
            alert["severity"] = "HIGH"
            alert["next_step"] = "Discuss with Chandra Soni before execution"
            self.report["triggers_fired"].append(alert)
        else:
            alert["action"] = "Continue monitoring"
            alert["severity"] = "LOW"
            if price < target_min:
                alert["note"] = f"Need bounce of ${target_min - price:.2f} to reach trim zone"
            self.report["positions_to_monitor"].append(alert)

        return alert

    def check_ionq_reentry(self):
        """Check IONQ for re-entry opportunity (<$50)"""
        data = self.fetch_stock_data("IONQ")
        if not data:
            return None

        price = data["current_price"]
        reentry_price = 50.00
        reentry_range = (48, 52)

        alert = {
            "symbol": "IONQ",
            "type": "RE_ENTRY_ALERT",
            "current_price": f"${price:.2f}",
            "reentry_target": f"${reentry_price:.2f}",
            "reentry_range": f"${reentry_range[0]}-${reentry_range[1]}",
            "1d_change": f"{data['1d_change']:.2f}%",
            "52week_high": f"${data['52week_high']:.2f}",
            "52week_low": f"${data['52week_low']:.2f}"
        }

        if price <= reentry_price:
            alert["status"] = "RE_ENTRY_ZONE_ACTIVE"
            alert["severity"] = "HIGH"
            alert["action"] = "ALERT: IONQ is in re-entry zone!"
            alert["suggested_action"] = "Buy 50-75 shares with volume confirmation"
            alert["next_step"] = "Validate volume >1.3x 20-day avg on TradingView, discuss with Chandra"
            self.report["triggers_fired"].append(alert)
        elif price <= reentry_range[1]:
            alert["status"] = "NEAR_REENTRY_ZONE"
            alert["severity"] = "MEDIUM"
            alert["action"] = "Monitor closely"
            alert["note"] = f"Need ${reentry_price - price:.2f} drop to reach target"
            self.report["positions_to_monitor"].append(alert)
        else:
            alert["status"] = "ABOVE_REENTRY_ZONE"
            alert["severity"] = "LOW"
            alert["action"] = "Continue monitoring"
            alert["note"] = f"${price - reentry_price:.2f} above reentry target"
            self.report["positions_to_monitor"].append(alert)

        return alert

    def check_googl_buildsignal(self):
        """Check GOOGL for build opportunity (SPDF uptrend)"""
        data = self.fetch_stock_data("GOOGL")
        if not data:
            return None

        prices = data["hist_prices"]
        sma50 = self.calculate_sma(prices, 50)
        sma200 = self.calculate_sma(prices, 200)
        current_price = data["current_price"]

        if not sma50 or not sma200:
            return None

        alert = {
            "symbol": "GOOGL",
            "type": "BUILD_OPPORTUNITY",
            "current_price": f"${current_price:.2f}",
            "sma_50": f"${sma50:.2f}",
            "sma_200": f"${sma200:.2f}",
            "above_50sma": current_price > sma50,
            "above_200sma": current_price > sma200,
            "1d_change": f"{data['1d_change']:.2f}%"
        }

        if current_price > sma50 and current_price > sma200:
            alert["trend"] = "UPTREND_CONFIRMED"
            alert["spdf_signal"] = "Layer 1 PASSED (Trend Gate)"
            alert["status"] = "BUILD_READY"
            alert["severity"] = "MEDIUM"
            alert["action"] = "Prepare to build - trend is favorable"
            alert["next_step"] = "Check Layer 2 (RSI) and Layer 3 (Volume) on TradingView"
            self.report["positions_to_monitor"].append(alert)
        else:
            alert["trend"] = "MIXED_OR_DOWNTREND"
            alert["spdf_signal"] = "Waiting for Layer 1 (Trend) confirmation"
            alert["status"] = "WAITING_FOR_UPTREND"
            alert["severity"] = "LOW"
            alert["action"] = "Monitor for uptrend setup"
            self.report["positions_to_monitor"].append(alert)

        return alert

    def check_spce_thesis(self):
        """Check SPCE thesis integrity (Delta trials Q3-Q4)"""
        data = self.fetch_stock_data("SPCE")
        if not data:
            return None

        alert = {
            "symbol": "SPCE",
            "type": "THESIS_HOLD",
            "current_price": f"${data['current_price']:.2f}",
            "thesis": "Delta Class spacecraft trials expected Q3-Q4 2026",
            "1d_change": f"{data['1d_change']:.2f}%",
            "52week_low": f"${data['52week_low']:.2f}",
            "status": "THESIS_INTACT"
        }

        if data["1d_change"] < -5:
            alert["severity"] = "MEDIUM"
            alert["warning"] = f"Large daily decline: {data['1d_change']:.2f}%"
            alert["action"] = "Check news for catalyst, hold if thesis unchanged"
            self.report["positions_to_monitor"].append(alert)
        else:
            alert["severity"] = "LOW"
            alert["action"] = "Hold position, monitor for catalyst"
            self.report["positions_to_monitor"].append(alert)

        alert["next_step"] = "Monitor for Delta Class trial announcements in Q3-Q4 2026"
        return alert

    def check_spcx_window(self):
        """Check for SpaceX ETF (SPCX) entry opportunity"""
        alert = {
            "symbol": "SPCX",
            "type": "NEW_OPPORTUNITY",
            "status": "AWAITING_LAUNCH",
            "ipo_date": "June 12, 2026",
            "entry_timing": "2-4 weeks post-IPO",
            "expected_behavior": "Temporary dips during index rebalancing",
            "action": "Monitor for ETF launch announcement",
            "severity": "LOW",
            "next_step": "Watch financial news for SPCX availability"
        }
        self.report["recommendations"].append(alert)
        return alert

    def add_tax_notes(self):
        """Add daily tax and RNOR status notes"""
        today = datetime.now()
        rnor_end = datetime(2027, 3, 31)
        days_remaining = (rnor_end - today).days

        self.report["tax_notes"] = {
            "rnor_status": "ACTIVE",
            "rnor_end_date": "2027-03-31",
            "days_remaining": days_remaining,
            "key_benefit": "Foreign-sourced income (US equities, crypto) NOT taxable in India",
            "current_strategy": "Use RNOR proactively for rebalancing (MSFT trim → GOOGL build)",
            "urgent_items": [
                "Declare Old Regime to Blinkit payroll (HRA exemption material)",
                "File ITR-2 with Schedule FA by July 31, 2026",
                "Resume PPF contributions for FY2026-27"
            ],
            "post_rnor_planning": "Transition to Ireland-domiciled ETFs (VUAA.L template) for long-term sit-and-forget"
        }

    def generate_summary(self):
        """Generate executive summary"""
        summary = {
            "total_alerts": len(self.report["alerts"]),
            "triggers_fired": len(self.report["triggers_fired"]),
            "positions_monitored": len(self.report["positions_to_monitor"]),
            "high_severity_items": len([x for x in self.report["triggers_fired"] if x.get("severity") == "HIGH"]),
            "executive_summary": []
        }

        if self.report["triggers_fired"]:
            summary["executive_summary"].append(
                f"🚨 {len(self.report['triggers_fired'])} active trigger(s) requiring attention"
            )

        if len(self.report["positions_to_monitor"]) > 0:
            summary["executive_summary"].append(
                f"📊 {len(self.report['positions_to_monitor'])} position(s) to monitor closely"
            )

        summary["executive_summary"].append(
            "✅ RNOR window active: Use for strategic rebalancing without tax drag"
        )
        summary["executive_summary"].append(
            "📋 Validate all actions with Chandra Soni (Anand Rathi) before execution"
        )

        return summary

    def generate_report(self):
        """Generate complete daily monitoring report"""
        print("Generating Daily Monitoring Report...")

        # Run all checks
        self.check_msft_trim_zone()
        self.check_ionq_reentry()
        self.check_googl_buildsignal()
        self.check_spce_thesis()
        self.check_spcx_window()
        self.add_tax_notes()

        # Add summary
        self.report["summary"] = self.generate_summary()

        # Save report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = self.data_dir / f"daily_report_{timestamp}.json"

        with open(report_file, "w") as f:
            json.dump(self.report, f, indent=2)

        print(f"✓ Report generated: {report_file}")
        return self.report

    def print_report_summary(self):
        """Print human-readable summary to console"""
        print("\n" + "="*70)
        print("DAILY MONITORING REPORT")
        print("="*70)
        print(f"Generated: {self.report['generated_at']}")
        print(f"Market Date: {self.report['market_date']}\n")

        print(f"📊 SUMMARY:")
        for line in self.report["summary"]["executive_summary"]:
            print(f"  {line}")

        if self.report["triggers_fired"]:
            print(f"\n🚨 ACTIVE TRIGGERS ({len(self.report['triggers_fired'])}):")
            for trigger in self.report["triggers_fired"]:
                print(f"\n  {trigger['symbol']}")
                print(f"    Type: {trigger['type']}")
                print(f"    Status: {trigger['status']}")
                print(f"    Action: {trigger['action']}")
                if "next_step" in trigger:
                    print(f"    Next: {trigger['next_step']}")

        if self.report["positions_to_monitor"]:
            print(f"\n📈 POSITIONS TO MONITOR ({len(self.report['positions_to_monitor'])}):")
            for position in self.report["positions_to_monitor"][:5]:  # Show top 5
                print(f"\n  {position['symbol']}")
                print(f"    Status: {position['status']}")
                print(f"    Action: {position['action']}")

        print(f"\n💰 TAX NOTES:")
        print(f"  RNOR Status: {self.report['tax_notes']['rnor_status']}")
        print(f"  Days Remaining: {self.report['tax_notes']['days_remaining']}")
        for item in self.report["tax_notes"]["urgent_items"]:
            print(f"  ⚠️  {item}")

        print("\n" + "="*70)


# Main execution
if __name__ == "__main__":
    generator = DailyMonitoringReportGenerator()
    report = generator.generate_report()
    generator.print_report_summary()
    
    print("\n✅ Daily monitoring report complete!")
    print("💡 Tip: Validate any HIGH severity items with Chandra Soni before trading")
