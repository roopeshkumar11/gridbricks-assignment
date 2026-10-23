import asyncio
import logging
import httpx

logger = logging.getLogger("keep_alive")

async def start_keep_alive_loop(url: str, interval_seconds: int = 600):
    """
    Periodically sends an HTTP GET request to /api/health via the public URL.
    This generates incoming external HTTP traffic to prevent Render free-tier
    services from spinning down (which happens after 15 minutes of inactivity).
    """
    health_url = url.rstrip("/") + "/api/health"
    logger.info(f"Keep-alive service active for {health_url} (interval: {interval_seconds}s)")

    # Wait 45 seconds after server boot before firing the first ping
    await asyncio.sleep(45)

    while True:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(health_url)
                logger.info(
                    f"Keep-alive ping sent to {health_url} -> Status {response.status_code}"
                )
        except asyncio.CancelledError:
            logger.info("Keep-alive task cancelled during shutdown.")
            break
        except Exception as exc:
            logger.warning(f"Keep-alive ping attempt to {health_url} failed: {exc}")

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            logger.info("Keep-alive sleep interrupted for shutdown.")
            break
