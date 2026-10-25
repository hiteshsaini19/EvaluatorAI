# Basic per-IP rate limiting, kept in memory. Enough for a single free-tier instance; the counts
# reset when the server restarts.
import math
import threading
import time
from collections import defaultdict, deque
from fastapi import HTTPException, Request, status


def client_ip(request: Request) -> str:
    # Behind a hosting proxy (e.g. Render) the real address is the last entry the proxy added
    # to X-Forwarded-For; earlier entries can be set by the client, so they're not trusted.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


class RateLimiter:
    # Allows `limit` requests per IP in any rolling `window_seconds`. Use as a FastAPI dependency.

    def __init__(self, limit: int, window_seconds: int, action: str):
        self.limit = limit
        self.window = window_seconds
        self.action = action  # Used in the error message, e.g. "login attempts"
        self.hits: dict[str, deque] = defaultdict(deque)
        self.lock = threading.Lock()

    def __call__(self, request: Request) -> None:
        now = time.monotonic()
        key = client_ip(request)
        with self.lock:
            hits = self.hits[key]
            while hits and hits[0] <= now - self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                retry_after = math.ceil(hits[0] + self.window - now)
                minutes = max(1, math.ceil(retry_after / 60))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "status": 429,
                        "error": f"Too many {self.action}. Please wait {minutes} minute{'s' if minutes != 1 else ''} and try again.",
                    },
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)
            # Drop IPs with no recent hits so memory doesn't grow forever
            if len(self.hits) > 10000:
                for ip in [ip for ip, q in self.hits.items() if not q or q[-1] <= now - self.window]:
                    del self.hits[ip]


login_limiter = RateLimiter(limit=10, window_seconds=5 * 60, action="login attempts")
signup_limiter = RateLimiter(limit=5, window_seconds=60 * 60, action="sign-ups from this network")
