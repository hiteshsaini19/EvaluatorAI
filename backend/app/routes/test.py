from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import timedelta
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, require_creator_or_admin
from app.attempts import now_utc
from app.generation import DIFFICULTY_ORDER, build_blueprint, get_generator
from app.ai.client import AIError
from app.ai.quota import quota_status
from app.ai.settings import load_settings
import json
import math
import time
import uuid

router = APIRouter(prefix="/tests", tags=["Tests"])

# A custom link expiry can be at most this far ahead
MAX_CUSTOM_VALIDITY = timedelta(days=365)

# An AI test is only saved if at least this share of the requested questions came back
MIN_AI_SHARE = 0.5

# What the creator is told when the AI request fails (details go to the generation log)
AI_ERROR_MESSAGES = {
    "auth": "AI generation isn't set up correctly right now (the AI service rejected our key). Please try again later.",
    "quota": "The AI service is busy or has reached its free limit. Please try again in a few minutes.",
    "timeout": "The AI service took too long to reply. Please try again; smaller tests are quicker.",
    "unavailable": "The AI service is unavailable right now. Please try again in a few minutes.",
    "bad_request": "The AI service rejected the request. Please try again later.",
    "bad_response": "The AI returned an unusable reply. Please try again.",
}


def generate_test_code() -> str:
    # Generate a unique test code using UUID
    return f"TEST-{uuid.uuid4().hex[:8].upper()}"


def error(status_code: int, message: str):
    return JSONResponse(status_code=status_code, content={"status": status_code, "error": message})


def can_manage(user: models.User, test: models.Test) -> bool:
    # Admin can manage every test; Creators only their own
    return user.role.role_name == "Admin" or test.user_id == user.id


def subject_names(db: Session, test: models.Test) -> list[str]:
    ids = json.loads(test.subject_ids)
    names = dict(db.query(models.Subject.id, models.Subject.name).filter(models.Subject.id.in_(ids)).all())
    return [names[i] for i in ids if i in names]


def attempt_counts(db: Session, test_ids: list[int]) -> dict[int, int]:
    if not test_ids:
        return {}
    return dict(
        db.query(models.Response.test_id, func.count(models.Response.id))
        .filter(models.Response.test_id.in_(test_ids))
        .group_by(models.Response.test_id)
        .all()
    )


def summarise(db: Session, test: models.Test, attempt_count: int) -> dict:
    return {
        "id": test.id,
        "test_name": test.test_name,
        "test_code": test.test_code,
        "subjects": subject_names(db, test),
        "difficulties": json.loads(test.difficulties),
        "num_questions": test.num_questions,
        "question_count": len(json.loads(test.questions_data)),
        "duration_minutes": test.duration_minutes,
        "expires_at": test.expires_at,
        "is_expired": now_utc() >= test.expires_at,
        "attempt_count": attempt_count,
        "created_at": test.created_at,
    }


# Generate Test - picks questions for the chosen subjects and difficulties
@router.post("/generate", response_model=schemas.TestGenerateResponse)
def generate_test(
    test_data: schemas.TestGenerate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_creator_or_admin)
):
    subjects_by_id = {
        s.id: s for s in db.query(models.Subject).filter(
            models.Subject.id.in_(test_data.subject_ids),
            models.Subject.is_active.is_(True)
        ).all()
    }
    missing = [sid for sid in test_data.subject_ids if sid not in subjects_by_id]
    if missing:
        return error(400, f"Unknown or inactive subject id(s): {', '.join(map(str, missing))}")

    if test_data.num_questions < len(subjects_by_id):
        return error(400, f"Choose at least {len(subjects_by_id)} questions, one for each subject")

    now = now_utc()
    if test_data.expires_at is not None:
        expires_at = test_data.expires_at
        if expires_at <= now:
            return error(400, "The link expiry must be in the future")
        if expires_at > now + MAX_CUSTOM_VALIDITY:
            return error(400, "The link expiry can be at most one year ahead")
    else:
        expires_at = now + timedelta(hours=test_data.valid_hours)

    # Catalogue order for subjects and Easy -> Hard for difficulties, so blueprints are predictable
    subjects = sorted(subjects_by_id.values(), key=lambda s: (s.sort_order, s.name))
    difficulties = [d for d in DIFFICULTY_ORDER if d in {x.value for x in test_data.difficulties}]

    settings = load_settings()
    if settings.enabled:
        quota = quota_status(db, current_user, settings)
        blocked = quota.blocked_message()
        if blocked:
            return JSONResponse(status_code=429, content={
                "status": 429,
                "error": f"{blocked} You can generate more after {quota.resets_at:%H:%M} UTC.",
                "code": "quota",
                "retry_at": quota.resets_at.isoformat(),
            })

    blueprint = build_blueprint(subjects, difficulties, test_data.num_questions)
    started = time.monotonic()

    def log(status: str, result=None, error_detail: str | None = None, calls: int = 0) -> models.GenerationLog:
        entry = models.GenerationLog(
            user_id=current_user.id,
            source="ai" if settings.enabled else "bank",
            status=status,
            requested_count=test_data.num_questions,
            question_count=len(result.questions) if result else 0,
            provider=settings.provider if settings.enabled else None,
            model=settings.model if settings.enabled else None,
            calls=result.calls if result else calls,
            duration_ms=int((time.monotonic() - started) * 1000),
            error=error_detail,
        )
        db.add(entry)
        return entry

    try:
        result = get_generator(settings).generate(db, blueprint)
    except AIError as e:
        log("failed", error_detail=f"{e.kind}: {e.detail}", calls=e.calls)
        db.commit()
        return JSONResponse(status_code=502, content={
            "status": 502, "error": AI_ERROR_MESSAGES.get(e.kind, AI_ERROR_MESSAGES["unavailable"]), "code": e.kind,
        })

    errors_detail = "\n".join(result.errors)[:4000] or None
    if not result.questions:
        if result.source == "ai":
            log("failed", result, errors_detail or "no usable questions")
            db.commit()
            return error(502, AI_ERROR_MESSAGES["bad_response"])
        return error(400, "No questions are available for the chosen subjects and difficulties")

    if result.source == "ai" and len(result.questions) < math.ceil(test_data.num_questions * MIN_AI_SHARE):
        log("failed", result, errors_detail)
        db.commit()
        return error(502, f"Only {len(result.questions)} of {test_data.num_questions} questions could be generated, "
                          "so the test wasn't saved. Please try again.")

    questions_data = [
        {
            "id": str(position),
            "source_question_id": q.source_question_id,
            "subject_id": q.subject_id,
            "subject": q.subject,
            "difficulty": q.difficulty,
            "question": q.question,
            "options": q.options,
            "answer": q.answer,
            "explanation": q.explanation,
        }
        for position, q in enumerate(result.questions, start=1)
    ]

    test_code = generate_test_code()
    while db.query(models.Test).filter(models.Test.test_code == test_code).first():
        test_code = generate_test_code()

    db_test = models.Test(
        test_name=test_data.test_name,
        test_code=test_code,
        questions_data=json.dumps(questions_data),
        subject_ids=json.dumps([s.id for s in subjects]),
        difficulties=json.dumps(difficulties),
        num_questions=test_data.num_questions,
        duration_minutes=test_data.duration_minutes,
        expires_at=expires_at,
        user_id=current_user.id
    )
    db.add(db_test)
    # The test and its log entry are saved together; nothing is saved if generation failed
    log("partial" if result.shortfalls else "success", result, errors_detail)
    db.commit()
    db.refresh(db_test)

    return schemas.TestGenerateResponse(
        test_id=db_test.id,
        test_name=db_test.test_name,
        test_code=db_test.test_code,
        requested_questions=test_data.num_questions,
        question_count=len(questions_data),
        shortfalls=[schemas.TestShortfall(**vars(s)) for s in result.shortfalls],
        source=result.source,
    )


# AI generation quota for the current creator (shown on the Create Test page)
@router.get("/generation-quota", response_model=schemas.GenerationQuota)
def get_generation_quota(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_creator_or_admin)
):
    settings = load_settings()
    if not settings.enabled:
        return schemas.GenerationQuota(ai_enabled=False)
    quota = quota_status(db, current_user, settings)
    return schemas.GenerationQuota(
        ai_enabled=True,
        used=quota.used,
        limit=quota.limit,
        remaining=quota.remaining,
        resets_at=quota.resets_at,
        blocked_message=quota.blocked_message(),
    )


# Get all tests created by current user (newest first)
@router.get("/my-tests", response_model=list[schemas.TestSummary])
def get_my_tests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    tests = (
        db.query(models.Test)
        .filter(models.Test.user_id == current_user.id)
        .order_by(models.Test.created_at.desc())
        .all()
    )
    counts = attempt_counts(db, [t.id for t in tests])
    return [summarise(db, test, counts.get(test.id, 0)) for test in tests]


# Get test by test_code, with questions and correct answers - owner or Admin
@router.get("/{test_code}", response_model=schemas.TestDetailResponse)
def get_test_by_code(
    test_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_test = db.query(models.Test).filter(models.Test.test_code == test_code).first()

    # 404 rather than 403 for other creators' tests, so codes aren't confirmed to exist
    if not db_test or not can_manage(current_user, db_test):
        return error(404, "Test not found")

    count = attempt_counts(db, [db_test.id]).get(db_test.id, 0)
    return {
        **summarise(db, db_test, count),
        "questions": json.loads(db_test.questions_data),
        "is_locked": count > 0,
    }


# Remove one question from a test - owner or Admin, only before any candidate has started
@router.delete("/{test_id}/questions/{question_id}")
def remove_test_question(
    test_id: int,
    question_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_creator_or_admin)
):
    # Lock the row so two removals at once can't overwrite each other
    db_test = db.query(models.Test).filter(models.Test.id == test_id).with_for_update().first()
    if not db_test or not can_manage(current_user, db_test):
        return error(404, "Test not found")

    if db.query(models.Response.id).filter(models.Response.test_id == test_id).first():
        return error(409, "Questions can't be removed after a candidate has started the test")

    questions = json.loads(db_test.questions_data)
    remaining = [q for q in questions if q["id"] != question_id]
    if len(remaining) == len(questions):
        return error(404, "Question not found in this test")
    if not remaining:
        return error(400, "A test needs at least one question. Delete the test instead.")

    db_test.questions_data = json.dumps(remaining)
    db.commit()

    return {"message": "Question removed", "question_count": len(remaining)}


# Delete test - Admin can delete any, Creator only their own
@router.delete("/{test_id}")
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_creator_or_admin)
):
    db_test = db.query(models.Test).filter(models.Test.id == test_id).first()

    if not db_test:
        raise HTTPException(status_code=404, detail="Test not found")

    if not can_manage(current_user, db_test):
        raise HTTPException(status_code=403, detail="You can only delete your own tests")

    # Delete candidate attempts for this test first (responses.test_id is NOT NULL)
    db.query(models.Response).filter(models.Response.test_id == test_id).delete()

    db.delete(db_test)
    db.commit()

    return {"message": "Test and its results deleted successfully"}
