import sqlite3
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from backend.app.config import SQLITE_DB_PATH

logger = logging.getLogger(__name__)

class StorageRepository:
    def __init__(self, db_path: str = SQLITE_DB_PATH):
        self.db_path = db_path
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        # Enable WAL mode for high concurrent read performance
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def init_db(self):
        """Create tables and indexes if they do not exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Actuals table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fuelhh_actuals (
                    start_time TEXT NOT NULL,
                    settlement_date TEXT NOT NULL,
                    settlement_period INTEGER NOT NULL,
                    fuel_type TEXT NOT NULL,
                    publish_time TEXT,
                    generation REAL NOT NULL,
                    PRIMARY KEY (fuel_type, start_time)
                );
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_actuals_date 
                ON fuelhh_actuals (settlement_date, fuel_type);
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_actuals_start 
                ON fuelhh_actuals (fuel_type, start_time);
            """)

            # Forecasts table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS windfor_forecasts (
                    publish_time TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    generation REAL NOT NULL,
                    PRIMARY KEY (publish_time, start_time)
                );
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_forecasts_start_publish 
                ON windfor_forecasts (start_time, publish_time);
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_forecasts_publish 
                ON windfor_forecasts (publish_time);
            """)
            conn.commit()
            logger.info(f"Database initialized at {self.db_path}")

    def save_fuelhh_batch(self, records: List[Dict[str, Any]]) -> int:
        """Insert or replace FUELHH actuals."""
        if not records:
            return 0
        sql = """
            INSERT OR REPLACE INTO fuelhh_actuals 
            (start_time, settlement_date, settlement_period, fuel_type, publish_time, generation)
            VALUES (?, ?, ?, ?, ?, ?);
        """
        rows = [
            (
                r.get("startTime"),
                r.get("settlementDate"),
                r.get("settlementPeriod"),
                r.get("fuelType", "WIND"),
                r.get("publishTime"),
                float(r.get("generation", 0.0))
            )
            for r in records
            if r.get("startTime") and r.get("generation") is not None
        ]
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(sql, rows)
            conn.commit()
            return len(rows)

    def save_windfor_batch(self, records: List[Dict[str, Any]]) -> int:
        """Insert or replace WINDFOR forecasts."""
        if not records:
            return 0
        sql = """
            INSERT OR REPLACE INTO windfor_forecasts 
            (publish_time, start_time, generation)
            VALUES (?, ?, ?);
        """
        rows = [
            (
                r.get("publishTime"),
                r.get("startTime"),
                float(r.get("generation", 0.0))
            )
            for r in records
            if r.get("publishTime") and r.get("startTime") and r.get("generation") is not None
        ]
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.executemany(sql, rows)
            conn.commit()
            return len(rows)

    def get_actuals_for_range(self, start_from: str, start_to: str, fuel_type: str = "WIND") -> List[Dict[str, Any]]:
        """Retrieve actuals ordered by start_time."""
        sql = """
            SELECT start_time, settlement_date, settlement_period, fuel_type, publish_time, generation
            FROM fuelhh_actuals
            WHERE fuel_type = ? AND start_time >= ? AND start_time <= ?
            ORDER BY start_time ASC;
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, (fuel_type, start_from, start_to))
            return [dict(row) for row in cursor.fetchall()]

    def get_actuals_for_date(self, date_str: str, fuel_type: str = "WIND") -> List[Dict[str, Any]]:
        """Retrieve 48 half-hour actuals for a specific settlement date."""
        sql = """
            SELECT start_time, settlement_date, settlement_period, fuel_type, publish_time, generation
            FROM fuelhh_actuals
            WHERE fuel_type = ? AND (settlement_date = ? OR start_time LIKE ?)
            ORDER BY start_time ASC;
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, (fuel_type, date_str, f"{date_str}%"))
            return [dict(row) for row in cursor.fetchall()]

    def get_latest_forecasts_before_cutoff(
        self,
        cutoff_iso: str,
        target_start_prefix: str,
    ) -> List[Dict[str, Any]]:
        """
        For each target start_time on the target day, find the latest forecast
        published ON OR BEFORE cutoff_iso.
        """
        sql = """
            WITH RankedForecasts AS (
                SELECT 
                    start_time,
                    publish_time,
                    generation,
                    ROW_NUMBER() OVER (
                        PARTITION BY start_time 
                        ORDER BY publish_time DESC
                    ) as rn
                FROM windfor_forecasts
                WHERE publish_time <= ? AND start_time LIKE ?
            )
            SELECT start_time, publish_time, generation
            FROM RankedForecasts
            WHERE rn = 1
            ORDER BY start_time ASC;
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, (cutoff_iso, f"{target_start_prefix}%"))
            return [dict(row) for row in cursor.fetchall()]

    def get_forecast_revisions(self, target_start_time: str) -> List[Dict[str, Any]]:
        """Retrieve all forecast publications for a specific target start_time."""
        sql = """
            SELECT publish_time, start_time, generation
            FROM windfor_forecasts
            WHERE start_time = ?
            ORDER BY publish_time ASC;
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, (target_start_time,))
            return [dict(row) for row in cursor.fetchall()]

    def get_all_forecasts_for_target_day(self, target_date_str: str) -> List[Dict[str, Any]]:
        """Get all forecasts published for any hour of the target date."""
        sql = """
            SELECT publish_time, start_time, generation
            FROM windfor_forecasts
            WHERE start_time LIKE ?
            ORDER BY publish_time ASC, start_time ASC;
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql, (f"{target_date_str}%",))
            return [dict(row) for row in cursor.fetchall()]

    def get_counts(self) -> Dict[str, Any]:
        """Return total count and min/max timestamps of actuals and forecasts."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT count(*), min(start_time), max(start_time) FROM fuelhh_actuals WHERE fuel_type = 'WIND';")
            act_cnt, act_min, act_max = cursor.fetchone()

            cursor.execute("SELECT count(*), min(publish_time), max(publish_time) FROM windfor_forecasts;")
            fc_cnt, fc_min, fc_max = cursor.fetchone()

            return {
                "actualsCount": act_cnt or 0,
                "actualsMinTime": act_min,
                "actualsMaxTime": act_max,
                "forecastsCount": fc_cnt or 0,
                "forecastsMinPublish": fc_min,
                "forecastsMaxPublish": fc_max,
            }
