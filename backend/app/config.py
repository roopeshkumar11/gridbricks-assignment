import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", str(DATA_DIR / "elexon_wind.db"))

ELEXON_API_BASE_URL = os.getenv("ELEXON_API_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
FUELHH_ENDPOINT = f"{ELEXON_API_BASE_URL}/datasets/FUELHH/stream"
WINDFOR_ENDPOINT = f"{ELEXON_API_BASE_URL}/datasets/WINDFOR/stream"

# January 2026 target window
DEFAULT_DECISION_START = "2026-01-01"
DEFAULT_DECISION_END = "2026-01-31"
DEFAULT_GATE_CLOSURE_TIME = "11:00:00Z"

# UK Wind Fleet approximate nominal capacity in GW/MW for January 2026 normalization
UK_NOMINAL_WIND_CAPACITY_MW = 30000.0

# Port configuration
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
