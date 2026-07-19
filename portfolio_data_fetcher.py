#!/usr/bin/env python3
"""
Portfolio Data Fetcher & Analyzer
Rahul Saxena's Investment Portfolio Dashboard
Integrates real-time data from multiple sources
"""

import json
import csv
from datetime import datetime, timedelta
import requests
import yfinance as yf
from pathlib import Path

class PortfolioDataFetcher:
    def __init__(self):
        self.api_key = "COTBD7WHID7LASF4"
        self.data_dir = Path("/mnt/user-data/outputs")
        self.holdings = self.load_holdings()
        
    def load_holdings(self):
        """Load master holdings data"""
        try:
            with open(self.data_dir / "portfolio_holdings_master.json", "r") as f:
                return json.load(f)
        except FileNotFoundError:
            print("Error: portfolio_holdings_master.json not found")
            return None

    def fetch_yfinance_data(self, symbol, period="1y"):
        """
        Fetch data using yfinance (free, no rate limits)
        Returns: OHLCV data, current price, 52-week high/low, etc.
        """
        try:
            print(f"Fetching yfinance data for {symbol}...")
            stock = yf.Ticker(symbol)
            
            # Get historical data
            hist = stock.history(period=period)
            
            # Get current info
            info = stock.info
            
            return {
                "symbol": symbol,
                "current_price": info.get("currentPrice", hist["Close"].iloc[-1]),
                "52_week_high": info.get("fiftyTwoWeekHigh", hist["High"].max()),
                "52_week_low": info.get("fiftyTwoWeekLow", hist["Low"].min()),
                "market_cap": info.get("marketCap", "N/A"),
                "pe_ratio": info.get("trailingPE", "N/A"),
                "dividend_yield": info.get("dividendYield", 0),
                "latest_close": hist["Close"].iloc[-1],
                "1d_change": ((hist["Close"].iloc[-1] - hist["Close"].iloc[-2]) / hist["Close"].iloc[-2] * 100) if len(hist) > 1 else 0,
                "hist_data": hist.to_dict(),
                "fetch_time": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error fetching {symbol}: {str(e)}")
            return None

    def calculate_sma(self, prices, window):
        """Calculate Simple Moving Average"""
        if len(prices) < window:
            return None
        return sum(prices[-window:]) / window

    def calculate_rsi(self, prices, window=14):
        """Calculate RSI(14) - Relative Strength Index"""
        if len(prices) < window + 1:
            return None
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        seed = deltas[:window]
        up = sum([d for d in seed if d > 0]) / window
        down = -sum([d for d in seed if d < 0]) / window
        
        rs = up / down if down != 0 else 0
        rsi = 100 - (100 / (1 + rs))
        
        # Continue calculation
        for d in deltas[window:]:
            if d > 0:
                up = (up * (window - 1) + d) / window
                down = (down * (window - 1)) / window
            else:
                up = (up * (window - 1)) / window
                down = (down * (window - 1) - d) / window
            rs = up / down if down != 0 else 0
            rsi = 100 - (100 / (1 + rs))
        
        return rsi

    def apply_spdf_framework(self, symbol, price_data):
        """
        SPDF Framework - Saxena Portfolio Decision Framework
        Returns signal: BUY, SELL, HOLD, or WAIT
        """
        try:
            closes = price_data["Close"].tolist()
            
            # Layer 1: Trend gate (50/200 SMA)
            sma50 = self.calculate_sma(closes, 50)
            sma200 = self.calculate_sma(closes, 200)
            current_price = closes[-1]
            
            if not sma50 or not sma200:
                return {"signal": "INSUFFICIENT_DATA", "message": "Need >200 days of data"}
            
            # Determine trend
            above_50 = current_price > sma50
            above_200 = current_price > sma200
            
            if above_50 and above_200:
                trend = "UPTREND"
            elif not above_50 and not above_200:
                trend = "DOWNTREND"
            else:
                trend = "MIXED"
            
            # Layer 2: Momentum (RSI)
            rsi = self.calculate_rsi(closes)
            
            # Layer 3: Volume analysis (requires price data)
            # Layer 4: ATR for volatility
            
            return {
                "symbol": symbol,
                "current_price": current_price,
                "sma_50": sma50,
                "sma_200": sma200,
                "trend": trend,
                "rsi_14": rsi,
                "above_50sma": above_50,
                "above_200sma": above_200,
                "spdf_signal": self.derive_signal(trend, rsi, above_50),
                "fetch_time": datetime.now().isoformat()
            }
        except Exception as e:
            return {"error": str(e)}

    def derive_signal(self, trend, rsi, buy_ready):
        """Derive trading signal from SPDF layers"""
        if trend == "UPTREND":
            if rsi and rsi < 35:
                return "STRONG_BUY" if buy_ready else "WAIT_FOR_VOLUME"
            elif rsi and rsi > 70:
                return "TAKE_PROFIT"
            else:
                return "HOLD"
        elif trend == "DOWNTREND":
            return "AVOID_BUY" if rsi and rsi > 50 else "MONITOR"
        else:
            return "HOLD"

    def fetch_all_holdings_data(self):
        """Fetch current data for all holdings"""
        results = {"timestamp": datetime.now().isoformat(), "holdings": {}}
        
        equity_symbols = list(self.holdings["equities"].keys()) + list(self.holdings["crypto"].keys())
        
        for symbol in equity_symbols:
            print(f"Processing {symbol}...")
            
            # Use yfinance for equities, alternative for crypto
            if symbol in self.holdings["crypto"]:
                # Crypto symbols need different handling
                print(f"Crypto {symbol}: Recommend manual update from external source")
                continue
            
            yf_data = self.fetch_yfinance_data(symbol)
            if yf_data:
                results["holdings"][symbol] = yf_data
        
        # Save results
        with open(self.data_dir / f"portfolio_snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json", "w") as f:
            json.dump(results, f, indent=2)
        
        return results

    def calculate_portfolio_metrics(self):
        """Calculate portfolio-level metrics"""
        if not self.holdings:
            return None
        
        total_cost_basis = 0
        total_market_value = 0
        
        # This would need current prices
        # For now, return structure
        
        return {
            "total_cost_basis": total_cost_basis,
            "total_market_value": total_market_value,
            "unrealized_gain_loss": total_market_value - total_cost_basis,
            "portfolio_return_pct": ((total_market_value - total_cost_basis) / total_cost_basis * 100) if total_cost_basis > 0 else 0,
            "number_of_positions": len([k for k, v in self.holdings["equities"].items() if v.get("shares", 0) > 0]),
            "cash_available": "Check DBS screenshot"
        }

    def generate_monitoring_report(self):
        """Generate comprehensive monitoring report"""
        report = {
            "generated_at": datetime.now().isoformat(),
            "period": "Daily Market Close",
            "key_watchlists": {
                "MSFT": {
                    "action": "Monitor for bounce to $430-440",
                    "thesis": "Trim zone activation, proceed to GOOGL build"
                },
                "GOOGL": {
                    "action": "Monitor for SPDF uptrend confirmation",
                    "thesis": "Build to meaningful second pillar"
                },
                "IONQ": {
                    "action": "Re-entry alert at $50 or below",
                    "thesis": "Q1 revenue +755%, 256-qubit sale, $3B+ cash"
                },
                "SPCE": {
                    "action": "Hold on weakness, monitor Delta Class trial progress",
                    "thesis": "Trials expected Q3-Q4 2026"
                }
            },
            "instructions": [
                "Update this report daily after market close",
                "Cross-reference TradingView SPDF analysis",
                "Check business news for catalyst events",
                "Validate all trade recommendations with Chandra (Anand Rathi)"
            ]
        }
        
        with open(self.data_dir / "daily_monitoring_report_template.json", "w") as f:
            json.dump(report, f, indent=2)
        
        return report


# Example usage
if __name__ == "__main__":
    fetcher = PortfolioDataFetcher()
    
    # Test with single symbol
    print("\n=== TESTING MSFT DATA FETCH ===")
    msft_data = fetcher.fetch_yfinance_data("MSFT", period="1y")
    if msft_data:
        print(f"✓ MSFT Current Price: ${msft_data['current_price']:.2f}")
        print(f"✓ 52-Week High: ${msft_data['52_week_high']:.2f}")
        print(f"✓ 1-Day Change: {msft_data['1d_change']:.2f}%")
    
    # Generate monitoring report
    print("\n=== GENERATING MONITORING REPORT ===")
    fetcher.generate_monitoring_report()
    print("✓ Report template created: daily_monitoring_report_template.json")
