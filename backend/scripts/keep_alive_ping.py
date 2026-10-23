"""
Standalone Render Keep-Alive Pinger

Usage:
    python backend/scripts/keep_alive_ping.py <BACKEND_URL>
Example:
    python backend/scripts/keep_alive_ping.py https://gridpulse-backend.onrender.com
"""

import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

def ping_loop(base_url: str, interval_seconds: int = 600):
    health_url = base_url.rstrip("/") + "/api/health"
    print(f"[{datetime.now().isoformat()}] Starting keep-alive pinger for: {health_url}")
    print(f"[{datetime.now().isoformat()}] Ping interval: {interval_seconds} seconds (~{interval_seconds // 60} mins)")
    print("Press Ctrl+C to stop.\n")

    while True:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            req = urllib.request.Request(
                health_url,
                headers={"User-Agent": "GridPulse-KeepAlive/1.0"}
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                print(f"[{timestamp}] SUCCESS -> HTTP {resp.status} (Render is active)")
        except urllib.error.HTTPError as e:
            print(f"[{timestamp}] HTTP Error: {e.code} - {e.reason}")
        except urllib.error.URLError as e:
            print(f"[{timestamp}] Connection Error (Server may be spinning up): {e.reason}")
        except Exception as e:
            print(f"[{timestamp}] Unexpected error: {e}")

        time.sleep(interval_seconds)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
    else:
        target_url = "https://gridpulse-backend.onrender.com"
        print(f"No URL provided. Defaulting to: {target_url}")
        print("To specify your URL: python keep_alive_ping.py https://<your-service>.onrender.com\n")

    ping_loop(target_url, interval_seconds=600)
