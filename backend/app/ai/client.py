# Minimal client for OpenAI-compatible chat completions (Gemini, Groq, OpenRouter, ...).
# Uses the standard library so the backend needs no extra dependency.
import json
import socket
import urllib.error
import urllib.request
from app.ai.settings import AISettings


class AIError(Exception):
    # `kind` decides what the creator is told; `detail` is kept for the generation log only
    def __init__(self, kind: str, detail: str):
        super().__init__(detail)
        self.kind = kind  # auth / quota / timeout / unavailable / bad_request / bad_response
        self.detail = detail
        self.calls = 0  # AI requests made before giving up (set by the generator)

    @property
    def fatal(self) -> bool:
        # Retrying won't help: wrong key, unknown model or a rejected request
        return self.kind in ("auth", "bad_request")


def chat_json(settings: AISettings, system: str, user: str) -> str:
    # Sends one request and returns the reply text (expected to be JSON)
    body = {
        "model": settings.model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.7,
        "max_tokens": settings.max_output_tokens,
    }
    if settings.response_format == "json_object":
        body["response_format"] = {"type": "json_object"}

    request = urllib.request.Request(
        settings.base_url.rstrip("/") + "/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=settings.timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8", errors="replace")[:500]
        if e.code in (401, 403):
            raise AIError("auth", f"HTTP {e.code}: {text}")
        if e.code == 429:
            raise AIError("quota", f"HTTP 429: {text}")
        if e.code in (400, 404, 422):
            raise AIError("bad_request", f"HTTP {e.code}: {text}")
        raise AIError("unavailable", f"HTTP {e.code}: {text}")
    except (socket.timeout, TimeoutError):
        raise AIError("timeout", f"No reply within {settings.timeout_seconds} seconds")
    except urllib.error.URLError as e:
        if isinstance(e.reason, (socket.timeout, TimeoutError)):
            raise AIError("timeout", f"No reply within {settings.timeout_seconds} seconds")
        raise AIError("unavailable", f"Could not reach the AI service: {e.reason}")
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        raise AIError("bad_response", f"Reply was not valid JSON: {e}")

    try:
        choice = payload["choices"][0]
        content = choice["message"].get("content") or ""
    except (KeyError, IndexError, TypeError, AttributeError):
        raise AIError("bad_response", f"Unexpected reply shape: {str(payload)[:300]}")

    if not content.strip():
        raise AIError("bad_response", f"Empty reply (finish_reason={choice.get('finish_reason')})")
    return content
