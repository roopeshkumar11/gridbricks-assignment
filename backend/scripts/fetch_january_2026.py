import os
import sys
import time
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.services.bmrs_client import BMRSClient
from backend.app.services.storage import StorageRepository

def main():
    print("=== Fetching Elexon BMRS January 2026 Dataset ===")
    storage = StorageRepository()
    client = BMRSClient(timeout=60.0)

    # Date range covering purchase decisions made in January 2026
    # (Dec 31, 2025 to Feb 2, 2026)
    dt_from = "2025-12-31T00:00:00Z"
    dt_to = "2026-02-02T00:00:00Z"

    print(f"1. Fetching FUELHH actuals from {dt_from} to {dt_to}...")
    t0 = time.time()
    try:
        fuelhh_data = client.fetch_fuelhh_sync(publish_from=dt_from, publish_to=dt_to, fuel_type_filter="WIND")
        print(f"   Fetched {len(fuelhh_data)} WIND outturn records in {time.time() - t0:.2f}s")
        saved_f = storage.save_fuelhh_batch(fuelhh_data)
        print(f"   Saved {saved_f} records to SQLite database.")
    except Exception as e:
        print(f"   Error fetching FUELHH: {e}")

    print(f"2. Fetching WINDFOR forecasts from {dt_from} to {dt_to}...")
    t0 = time.time()
    try:
        windfor_data = client.fetch_windfor_sync(publish_from=dt_from, publish_to=dt_to)
        print(f"   Fetched {len(windfor_data)} WINDFOR forecast records in {time.time() - t0:.2f}s")
        saved_w = storage.save_windfor_batch(windfor_data)
        print(f"   Saved {saved_w} records to SQLite database.")
    except Exception as e:
        print(f"   Error fetching WINDFOR: {e}")

    counts = storage.get_counts()
    print("\n=== Storage Summary ===")
    print(f"Total WIND Actuals: {counts['actualsCount']} (from {counts['actualsMinTime']} to {counts['actualsMaxTime']})")
    print(f"Total WINDFOR Forecasts: {counts['forecastsCount']} (from {counts['forecastsMinPublish']} to {counts['forecastsMaxPublish']})")
    print("Seeding completed successfully!")

if __name__ == "__main__":
    main()
