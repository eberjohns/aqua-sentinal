from fastapi import APIRouter, HTTPException, Query
import requests
import logging
from typing import Optional
from ..config import NEWS_API_KEY

router = APIRouter()

NEWSDATA_URL = "https://newsdata.io/api/1/news"
logger = logging.getLogger("backend.news")


@router.get("/news")
def news_proxy(q: Optional[str] = Query("floods"), language: Optional[str] = Query("en"), page: Optional[int] = Query(None)):
    """Proxy endpoint to fetch news from newsdata.io using server-side API key.

    Query params:
    - q: search query (default: floods)
    - language: language code (default: en)
    - page: pagination page number
    """
    if not NEWS_API_KEY:
        logger.error("NEWS_API_KEY is not configured in the server environment")
        raise HTTPException(status_code=500, detail="News API not configured on server")

    params = {
        "apikey": NEWS_API_KEY,
        "q": q,
        "language": language,
    }
    if page is not None:
        params["page"] = page

    logger.debug("Fetching news with params: %s", params)

    try:
        resp = requests.get(NEWSDATA_URL, params=params, timeout=10)
    except requests.RequestException as e:
        # Network-level error when contacting upstream
        logger.exception("Request to news provider failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to reach news provider")

    if resp.status_code != 200:
        # Log upstream response for debugging and include trimmed body in detail for diagnostics
        logger.error("News provider returned status %s: %s", resp.status_code, resp.text)
        trimmed = resp.text[:1000]
        raise HTTPException(status_code=502, detail=f"Upstream news provider returned status {resp.status_code}: {trimmed}")

    try:
        return resp.json()
    except ValueError:
        logger.error("Invalid JSON received from news provider: %s", resp.text)
        raise HTTPException(status_code=502, detail="Invalid response from news provider")
