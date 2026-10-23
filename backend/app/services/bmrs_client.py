import logging
import httpx
from typing import List, Dict, Any, Optional
from backend.app.config import FUELHH_ENDPOINT, WINDFOR_ENDPOINT

logger = logging.getLogger(__name__)

class BMRSClient:
    """Client for Elexon BMRS Insights Solution API datasets."""

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "GridBricks-BMRS-App/1.0",
            "Accept": "application/json",
        }

    async def fetch_fuelhh_actuals(
        self,
        publish_from: str,
        publish_to: str,
        fuel_type_filter: str = "WIND",
    ) -> List[Dict[str, Any]]:
        """
        Fetch outturn generation from FUELHH/stream endpoint.
        Filters for fuelType == 'WIND'.
        """
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to,
        }
        logger.info(f"Fetching FUELHH from {publish_from} to {publish_to}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(FUELHH_ENDPOINT, params=params, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()
            
            # Filter fuelType
            if fuel_type_filter:
                filtered = [
                    d for d in data
                    if d.get("fuelType") == fuel_type_filter
                ]
                logger.info(f"Retrieved {len(data)} FUELHH total records, {len(filtered)} {fuel_type_filter} actuals")
                return filtered
            return data

    async def fetch_windfor_forecasts(
        self,
        publish_from: str,
        publish_to: str,
    ) -> List[Dict[str, Any]]:
        """
        Fetch wind forecasts from WINDFOR/stream endpoint.
        """
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to,
        }
        logger.info(f"Fetching WINDFOR from {publish_from} to {publish_to}")
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(WINDFOR_ENDPOINT, params=params, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"Retrieved {len(data)} WINDFOR forecast records")
            return data

    def fetch_fuelhh_sync(
        self,
        publish_from: str,
        publish_to: str,
        fuel_type_filter: str = "WIND",
    ) -> List[Dict[str, Any]]:
        """Synchronous version for seeding/scripts."""
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to,
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(FUELHH_ENDPOINT, params=params, headers=self.headers)
            resp.raise_for_status()
            data = resp.json()
            if fuel_type_filter:
                return [d for d in data if d.get("fuelType") == fuel_type_filter]
            return data

    def fetch_windfor_sync(
        self,
        publish_from: str,
        publish_to: str,
    ) -> List[Dict[str, Any]]:
        """Synchronous version for seeding/scripts."""
        params = {
            "publishDateTimeFrom": publish_from,
            "publishDateTimeTo": publish_to,
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(WINDFOR_ENDPOINT, params=params, headers=self.headers)
            resp.raise_for_status()
            return resp.json()
