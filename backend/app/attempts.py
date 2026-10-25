# Attempt rules shared by the candidate API and the results pages.
# There are no background workers on the free hosting, so attempts past their deadline
# are finalised lazily, whenever an attempt or a results list is read.
import json
from datetime import datetime, timedelta, timezone
from typing import Iterable, Optional
from sqlalchemy.orm import Session
from app import models

# Submissions are accepted this long after the deadline, to allow for slow networks
SUBMIT_GRACE = timedelta(seconds=15)

IN_PROGRESS = "in_progress"
SUBMITTED = "submitted"
TIMED_OUT = "timed_out"


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def load_questions(test: models.Test) -> list:
    return json.loads(test.questions_data)


def load_answers(attempt: models.Response) -> dict:
    return json.loads(attempt.answers or "{}")


def score_answers(questions: list, answers: dict) -> int:
    return sum(1 for q in questions if answers.get(q["id"]) == q["answer"])


def finalise(attempt: models.Response, status: str, submitted_at: datetime) -> None:
    attempt.score = score_answers(load_questions(attempt.test), load_answers(attempt))
    attempt.status = status
    attempt.submitted_at = submitted_at


def is_past_grace(attempt: models.Response, now: Optional[datetime] = None) -> bool:
    return (now or now_utc()) > attempt.deadline + SUBMIT_GRACE


def finalise_expired(db: Session, attempts: Iterable[models.Response]) -> None:
    # Closes in-progress attempts whose time (plus grace) has run out, scoring their saved answers
    now = now_utc()
    changed = False
    for attempt in attempts:
        if attempt.status == IN_PROGRESS and is_past_grace(attempt, now):
            finalise(attempt, TIMED_OUT, attempt.deadline)
            changed = True
    if changed:
        db.commit()


def time_used_seconds(attempt: models.Response) -> int:
    end = min(attempt.submitted_at or now_utc(), attempt.deadline)
    return max(0, int((end - attempt.started_at).total_seconds()))


def format_duration(seconds: int) -> str:
    minutes, secs = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}h {minutes:02d}m {secs:02d}s"
    return f"{minutes:02d}:{secs:02d}"
