import json
import secrets
from datetime import timedelta
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.attempts import (
    IN_PROGRESS, SUBMITTED, TIMED_OUT, SUBMIT_GRACE,
    now_utc, load_questions, load_answers, finalise, finalise_expired,
)
from app.routes.test import subject_names

# Candidate endpoints: no login. A test is addressed by its code, an attempt by its random token.
router = APIRouter(prefix="/public", tags=["Candidate"])


def error(status_code: int, message: str, code: str):
    # `code` lets the candidate pages show the right screen (expired, already attempted, ...)
    return JSONResponse(status_code=status_code, content={"status": status_code, "error": message, "code": code})


def test_not_found():
    return error(404, "This test link is invalid. Please check the link you were sent.", "not_found")


def attempt_not_found():
    return error(404, "This attempt could not be found. Open the test link again.", "attempt_not_found")


def attempt_state(attempt: models.Response) -> schemas.AttemptState:
    test = attempt.test
    questions = load_questions(test)
    answers = load_answers(attempt)
    in_progress = attempt.status == IN_PROGRESS
    return schemas.AttemptState(
        attempt_token=attempt.attempt_token,
        test_name=test.test_name,
        test_code=test.test_code,
        candidate_name=attempt.candidate.name,
        candidate_email=attempt.candidate.email,
        status=attempt.status,
        # Questions (never the answers) are only sent while the attempt is open
        questions=[
            schemas.AttemptQuestion(
                id=q["id"], subject=q["subject"], difficulty=q["difficulty"],
                question=q["question"], options=q["options"],
            )
            for q in questions
        ] if in_progress else [],
        answers=answers if in_progress else {},
        question_count=len(questions),
        answered_count=sum(1 for q in questions if q["id"] in answers),
        duration_minutes=test.duration_minutes,
        started_at=attempt.started_at,
        deadline=attempt.deadline,
        submitted_at=attempt.submitted_at,
        server_time=now_utc(),
    )


def clean_answers(questions: list, answers: dict) -> dict | str:
    # Returns the answers with valid question ids and option letters, or an error message
    options_by_id = {q["id"]: q["options"] for q in questions}
    cleaned = {}
    for question_id, selected in answers.items():
        if question_id not in options_by_id:
            return f"Unknown question id '{question_id}'"
        selected = (selected or "").strip().upper()
        if not selected:
            continue  # Cleared answer
        if selected not in options_by_id[question_id]:
            return f"'{selected}' is not an option of question '{question_id}'"
        cleaned[question_id] = selected
    return cleaned


def get_attempt_for_update(db: Session, token: str) -> models.Response | None:
    # Row lock, so saves and submits for one attempt are applied one at a time
    return (
        db.query(models.Response)
        .filter(models.Response.attempt_token == token)
        .with_for_update()
        .first()
    )


# Test information for the entry screen (no questions)
@router.get("/tests/{test_code}", response_model=schemas.PublicTestInfo)
def get_public_test(test_code: str, db: Session = Depends(get_db)):
    test = db.query(models.Test).filter(models.Test.test_code == test_code).first()
    if not test:
        return test_not_found()

    now = now_utc()
    return schemas.PublicTestInfo(
        test_name=test.test_name,
        test_code=test.test_code,
        subjects=subject_names(db, test),
        question_count=len(load_questions(test)),
        duration_minutes=test.duration_minutes,
        expires_at=test.expires_at,
        is_expired=now >= test.expires_at,
        server_time=now,
    )


# Start (or resume) an attempt
@router.post("/tests/{test_code}/start", response_model=schemas.AttemptState)
def start_attempt(test_code: str, data: schemas.AttemptStart, db: Session = Depends(get_db)):
    # Lock the test row so a question can't be removed while the first attempt is being created
    test = db.query(models.Test).filter(models.Test.test_code == test_code).with_for_update().first()
    if not test:
        return test_not_found()

    candidate = db.query(models.Candidate).filter(models.Candidate.email == data.email).first()

    if candidate:
        attempt = db.query(models.Response).filter(
            models.Response.test_id == test.id,
            models.Response.candidate_id == candidate.id,
        ).first()
        if attempt:
            finalise_expired(db, [attempt])
            if attempt.status != IN_PROGRESS:
                return error(409, "You have already taken this test. Only one attempt is allowed.", "already_attempted")
            # Someone mid-test can always come back, even after the link has expired
            return attempt_state(attempt)

    now = now_utc()
    if now >= test.expires_at:
        return error(410, "This test link has expired and no longer accepts new candidates.", "expired")

    if not candidate:
        candidate = models.Candidate(name=data.name, email=data.email)
        db.add(candidate)
        db.flush()

    attempt = models.Response(
        candidate_id=candidate.id,
        test_id=test.id,
        test_name=test.test_name,
        attempt_token=secrets.token_urlsafe(32),
        status=IN_PROGRESS,
        answers="{}",
        started_at=now,
        deadline=now + timedelta(minutes=test.duration_minutes),
    )
    db.add(attempt)
    try:
        db.commit()
    except IntegrityError:
        # The same email started twice at the same moment (or a new candidate row raced); use the winner
        db.rollback()
        attempt = (
            db.query(models.Response)
            .join(models.Candidate)
            .filter(models.Response.test_id == test.id, models.Candidate.email == data.email)
            .first()
        )
        if not attempt:
            return error(409, "Could not start the test. Please try again.", "conflict")
        if attempt.status != IN_PROGRESS:
            return error(409, "You have already taken this test. Only one attempt is allowed.", "already_attempted")

    db.refresh(attempt)
    return attempt_state(attempt)


# Resume: questions, saved answers, deadline and server time
@router.get("/attempts/{token}", response_model=schemas.AttemptState)
def get_attempt(token: str, db: Session = Depends(get_db)):
    attempt = db.query(models.Response).filter(models.Response.attempt_token == token).first()
    if not attempt:
        return attempt_not_found()

    finalise_expired(db, [attempt])
    return attempt_state(attempt)


# Save answers (the full set so far). Rejected after the deadline.
@router.put("/attempts/{token}/answers")
def save_answers(token: str, data: schemas.AttemptAnswers, db: Session = Depends(get_db)):
    attempt = get_attempt_for_update(db, token)
    if not attempt:
        return attempt_not_found()

    if attempt.status != IN_PROGRESS:
        return error(409, "This test has already been submitted.", "finished")

    now = now_utc()
    if now > attempt.deadline:
        db.commit()  # Release the row lock
        finalise_expired(db, [attempt])
        return error(409, "Time is up. Answers can no longer be changed.", "time_up")

    answers = clean_answers(load_questions(attempt.test), data.answers)
    if isinstance(answers, str):
        db.commit()
        return error(400, answers, "invalid_answer")

    attempt.answers = json.dumps(answers)
    db.commit()

    return {"saved": len(answers), "deadline": attempt.deadline, "server_time": now}


# Submit. Accepted until the deadline plus a short grace period; after that the
# attempt is closed as timed out using the answers saved so far.
@router.post("/attempts/{token}/submit", response_model=schemas.AttemptState)
def submit_attempt(token: str, data: schemas.AttemptAnswers | None = None, db: Session = Depends(get_db)):
    attempt = get_attempt_for_update(db, token)
    if not attempt:
        return attempt_not_found()

    if attempt.status != IN_PROGRESS:
        db.commit()
        return attempt_state(attempt)  # Already finished: submitting again changes nothing

    now = now_utc()
    if now > attempt.deadline + SUBMIT_GRACE:
        finalise(attempt, TIMED_OUT, attempt.deadline)
        db.commit()
        return attempt_state(attempt)

    if data is not None:
        answers = clean_answers(load_questions(attempt.test), data.answers)
        if isinstance(answers, str):
            db.commit()
            return error(400, answers, "invalid_answer")
        attempt.answers = json.dumps(answers)

    # Submitted within the grace period after the deadline = the time ran out (auto-submit)
    if now <= attempt.deadline:
        finalise(attempt, SUBMITTED, now)
    else:
        finalise(attempt, TIMED_OUT, attempt.deadline)
    db.commit()

    return attempt_state(attempt)
