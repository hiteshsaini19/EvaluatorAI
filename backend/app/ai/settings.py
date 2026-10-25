# AI settings, read from the environment (backend/.env). Switching provider only needs
# AI_PROVIDER / AI_MODEL / AI_API_KEY; every provider is called through its
# OpenAI-compatible chat completions endpoint.
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

PROVIDER_PRESETS = {
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-3.8-flash",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1/",
        "model": "openai/gpt-oss-120b",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1/",
        "model": "",  # Must be set with AI_MODEL
    },
}


@dataclass(frozen=True)
class AISettings:
    provider: str
    base_url: str
    model: str
    api_key: str
    timeout_seconds: int  # Per AI request
    questions_per_call: int  # Larger tests are split into several requests
    max_parallel_calls: int
    max_output_tokens: int
    response_format: str  # json_object / none
    daily_limit_per_user: int
    daily_limit_global: int

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.base_url and self.model)


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, "").strip() or default)
    except ValueError:
        return default


def load_settings() -> AISettings:
    provider = os.getenv("AI_PROVIDER", "gemini").strip().lower()
    preset = PROVIDER_PRESETS.get(provider, {"base_url": "", "model": ""})
    return AISettings(
        provider=provider,
        base_url=os.getenv("AI_BASE_URL", "").strip() or preset["base_url"],
        model=os.getenv("AI_MODEL", "").strip() or preset["model"],
        api_key=os.getenv("AI_API_KEY", "").strip(),
        timeout_seconds=_int("AI_TIMEOUT_SECONDS", 90),
        questions_per_call=max(1, _int("AI_QUESTIONS_PER_CALL", 20)),
        max_parallel_calls=max(1, _int("AI_MAX_PARALLEL_CALLS", 3)),
        max_output_tokens=_int("AI_MAX_OUTPUT_TOKENS", 16000),
        response_format=os.getenv("AI_RESPONSE_FORMAT", "json_object").strip().lower(),
        daily_limit_per_user=_int("AI_DAILY_LIMIT_PER_USER", 5),
        daily_limit_global=_int("AI_DAILY_LIMIT_GLOBAL", 50),
    )
