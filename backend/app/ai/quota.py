# Daily limits on AI generation, to stay inside the provider's free quota.
# Days are counted in UTC: the limits reset at 00:00 UTC.
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app import models
from app.ai.settings import AISettings


@dataclass
class QuotaStatus:
    used: int  # The creator's successful AI generations today
    limit: Optional[int]  # None = no per-creator limit (Admin)
    global_used: int  # AI generation attempts today, by everyone
    global_limit: int
    resets_at: datetime

    @property
    def remaining(self) -> Optional[int]:
        return None if self.limit is None else max(0, self.limit - self.used)

    def blocked_message(self) -> Optional[str]:
        if self.limit is not None and self.used >= self.limit:
            return f"You've used all {self.limit} AI-generated tests for today."
        if self.global_used >= self.global_limit:
            return "The daily AI generation limit for EvaluatorAI has been reached."
        return None


def day_bounds(now: datetime) -> tuple[datetime, datetime]:
    start = now.astimezone(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=1)


def quota_status(db: Session, user: models.User, settings: AISettings) -> QuotaStatus:
    start, end = day_bounds(datetime.now(timezone.utc))
    today = db.query(models.GenerationLog).filter(
        models.GenerationLog.source == "ai",
        models.GenerationLog.created_at >= start,
    )
    # Every AI attempt uses the provider's quota, so the global cap counts failures too.
    # The creator's own cap only counts tests they actually got.
    global_used = today.count()
    used = today.filter(
        models.GenerationLog.user_id == user.id,
        models.GenerationLog.status != "failed",
    ).count()
    is_admin = user.role.role_name == "Admin"
    return QuotaStatus(
        used=used,
        limit=None if is_admin else settings.daily_limit_per_user,
        global_used=global_used,
        global_limit=settings.daily_limit_global,
        resets_at=end,
    )
