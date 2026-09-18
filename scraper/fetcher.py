"""Generic page fetcher for Tier 4 sources (university websites) and any
other JS-rendered page. Not needed for OpenAlex (Tier 3) or a source with a
plain JSON/REST API -- use those directly with httpx instead, it's faster
and doesn't need a browser.

NOTE ON TESTING: this module cannot be exercised in the sandbox this was
written in -- Playwright needs to download browser binaries from a CDN
that isn't on that sandbox's network allowlist, and there's no live
network access to arbitrary university sites either. The logic (rate
limiting, archival) is straightforward and mirrors the dev plan's own
skeleton (Chapter 5.2), but you should smoke-test this against a real
target before relying on it:
  playwright install chromium
  python -c "from scraper.fetcher import PageFetcher; ..."
"""

from __future__ import annotations

import asyncio
import hashlib
import os
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

from playwright.async_api import async_playwright

# Be a polite, identifiable, rate-limited bot. Respecting robots.txt is the
# caller's responsibility (see should_fetch below) -- this class only
# handles the rate limiting and archival mechanics.
USER_AGENT = "EduPathBot/1.0 (+https://edupath.example/bot)"


class PageFetcher:
    def __init__(self, r2_bucket: str | None = None, min_seconds_between_requests: float = 1.0):
        self.r2_bucket = r2_bucket or os.environ.get("R2_RAW_HTML_BUCKET", "edupath-raw-html")
        self.min_seconds_between_requests = min_seconds_between_requests
        self._last_request_time: dict[str, float] = {}
        self._s3_client = None  # lazily created; see _s3()

    def _s3(self):
        if self._s3_client is None:
            import boto3

            self._s3_client = boto3.client(
                "s3",
                endpoint_url=os.environ["R2_ENDPOINT_URL"],
                aws_access_key_id=os.environ["CLOUDFLARE_R2_ACCESS_KEY"],
                aws_secret_access_key=os.environ["CLOUDFLARE_R2_SECRET_KEY"],
            )
        return self._s3_client

    async def _respect_rate_limit(self, host: str) -> None:
        now = time.monotonic()
        last = self._last_request_time.get(host)
        if last is not None:
            elapsed = now - last
            if elapsed < self.min_seconds_between_requests:
                await asyncio.sleep(self.min_seconds_between_requests - elapsed)
        self._last_request_time[host] = time.monotonic()

    def _archive(self, source: str, url: str, html: str) -> None:
        key = f"{source}/{hashlib.sha256(url.encode()).hexdigest()[:16]}.html"
        self._s3().put_object(
            Bucket=self.r2_bucket,
            Key=key,
            Body=html.encode("utf-8"),
            Metadata={"source_url": url, "scraped_at": datetime.now(timezone.utc).isoformat()},
        )

    async def fetch(self, url: str, source: str, archive: bool = True) -> str | None:
        """Fetch a URL with per-host rate limiting, returning rendered HTML.

        Archives to R2 first (if `archive`) so a parsing failure downstream
        can be debugged/replayed without re-hitting the source -- per dev
        plan 5.2, this also doubles as evidence of exactly what was
        scraped and when.
        """
        host = urlparse(url).netloc
        await self._respect_rate_limit(host)

        async with async_playwright() as p:
            browser = await p.chromium.launch()
            try:
                ctx = await browser.new_context(user_agent=USER_AGENT)
                page = await ctx.new_page()
                resp = await page.goto(url, wait_until="networkidle", timeout=30_000)
                if not resp or resp.status != 200:
                    return None
                html = await page.content()
            finally:
                await browser.close()

        if archive:
            self._archive(source, url, html)

        return html
