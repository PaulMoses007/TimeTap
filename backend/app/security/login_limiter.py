"""
Simple in-memory brake on repeated failed logins.

Five wrong passwords from the same address for the same email block
further tries for 15 minutes. The counters live in memory, so they reset
when the server restarts - good enough to stop guessing attacks on a
single Render instance.
"""

import threading
import time

from fastapi import HTTPException

MAX_FAILURES = 5
WINDOW_SECONDS = 15 * 60

_failures: dict[str, list[float]] = {}
_lock = threading.Lock()


def _recent(key: str, now: float) -> list[float]:
    kept = [t for t in _failures.get(key, []) if now - t < WINDOW_SECONDS]
    if kept:
        _failures[key] = kept
    else:
        _failures.pop(key, None)
    return kept


def make_key(email: str, client_ip: str | None) -> str:
    return f"{(email or '').strip().lower()}|{client_ip or '-'}"


def check_allowed(key: str) -> None:
    now = time.time()
    with _lock:
        attempts = _recent(key, now)
        if len(attempts) >= MAX_FAILURES:
            wait = int(WINDOW_SECONDS - (now - attempts[0]))
            minutes = max(1, (wait + 59) // 60)
            raise HTTPException(
                status_code=429,
                detail=f"Too many failed login attempts. Try again in {minutes} minute(s).",
            )


def record_failure(key: str) -> None:
    now = time.time()
    with _lock:
        _recent(key, now)
        _failures.setdefault(key, []).append(now)


def record_success(key: str) -> None:
    with _lock:
        _failures.pop(key, None)


def reset_all() -> None:
    with _lock:
        _failures.clear()
