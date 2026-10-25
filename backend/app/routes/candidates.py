from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app import models, schemas
from app.database import get_db
from app.auth import require_admin, require_creator_or_admin
from app.attempts import (
    IN_PROGRESS, load_questions, load_answers, finalise_expired, time_used_seconds, format_duration,
)

router = APIRouter(prefix="/candidates", tags=["Candidates"])


def is_admin(user: models.User) -> bool:
    return user.role.role_name == "Admin"


def owns_test(user: models.User, test: models.Test) -> bool:
    # Admin can access every test; Creators only their own
    return is_admin(user) or test.user_id == user.id


def not_found(message: str):
    return JSONResponse(status_code=404, content={"status": 404, "error": message})


# GET RESULT BY RESPONSE ID (Admin/Creator Only)
# Keyed by response ID (same ID the results list returns), since one candidate can take many tests
@router.get("/result/{response_id}", response_model=schemas.CandidateResultResponse)
def get_candidate_result(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_creator_or_admin)
):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()

    # 404 rather than 403 for other creators' results, so IDs aren't confirmed to exist
    if not response or not owns_test(current_user, response.test):
        return not_found("Result not found")

    finalise_expired(db, [response])

    questions = load_questions(response.test)
    answers = load_answers(response)
    correct_answers = sum(1 for q in questions if answers.get(q["id"]) == q["answer"])
    answered = sum(1 for q in questions if q["id"] in answers)
    total_questions = len(questions)
    score_percentage = (correct_answers / total_questions * 100) if total_questions > 0 else 0
    time_used = time_used_seconds(response)

    breakdown = [
        schemas.QuestionBreakdown(
            question_id=q["id"],
            question_text=q["question"],
            selected_option=answers.get(q["id"]),
            correct_option=q["answer"],
            is_correct=answers.get(q["id"]) == q["answer"],
            options=q["options"],
            difficulty=q["difficulty"],
            subject_name=q["subject"],
            explanation=q.get("explanation", ""),
        )
        for q in questions
    ]

    candidate_detail = schemas.CandidateDetailResponse(
        id=response.candidate.id,
        name=response.candidate.name,
        email=response.candidate.email,
        test_id=response.test_id,
        test_code=response.test.test_code,
        test_name=response.test_name,
        status=response.status,
        time_used=time_used,
        time_used_formatted=format_duration(time_used),
        duration_minutes=response.test.duration_minutes,
        total_questions=total_questions,
        correct_answers=correct_answers,
        unanswered_count=total_questions - answered,
        score=round(score_percentage, 2),
        started_at=response.started_at,
        submitted_at=response.submitted_at,
    )

    return schemas.CandidateResultResponse(candidate=candidate_detail, responses=breakdown)


# GET ALL RESULTS (Admin/Creator Only)
@router.get("/results", response_model=List[schemas.CandidateListItem])
def get_all_results(
    test_code: Optional[str] = Query(None, description="Filter by test code"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_creator_or_admin)
):
    query = db.query(models.Response).options(
        joinedload(models.Response.candidate), joinedload(models.Response.test)
    )

    # Creators only see results for their own tests
    if not is_admin(current_user):
        query = query.join(models.Test, models.Response.test_id == models.Test.id).filter(
            models.Test.user_id == current_user.id
        )

    if test_code:
        test = db.query(models.Test).filter(models.Test.test_code == test_code).first()
        if not test or not owns_test(current_user, test):
            return not_found("Test not found")
        query = query.filter(models.Response.test_id == test.id)

    # Most recent first
    responses = query.order_by(models.Response.started_at.desc()).all()
    finalise_expired(db, responses)

    result = []
    for response in responses:
        questions = load_questions(response.test)
        answers = load_answers(response)
        total_questions = len(questions)
        answered = sum(1 for q in questions if q["id"] in answers)
        finished = response.status != IN_PROGRESS

        result.append(schemas.CandidateListItem(
            id=response.id,
            name=response.candidate.name,
            email=response.candidate.email,
            test_code=response.test.test_code,
            test_name=response.test_name,
            status=response.status,
            score=f"{response.score}/{total_questions}" if finished else None,
            score_percentage=(
                int(response.score / total_questions * 100) if total_questions > 0 else 0
            ) if finished else None,
            unanswered_count=total_questions - answered,
            time_used_formatted=format_duration(time_used_seconds(response)),
            started_at=response.started_at,
            submitted_at=response.submitted_at,
        ))

    return result


# DELETE CANDIDATE (Admin Only)
@router.delete("/{candidate_id}")
def delete_candidate(
    candidate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    candidate = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not candidate:
        return not_found("Candidate not found")

    # Delete attempts first, then the candidate
    db.query(models.Response).filter(models.Response.candidate_id == candidate_id).delete()
    db.delete(candidate)
    db.commit()

    return {"message": "Candidate and their responses deleted successfully"}


# DELETE RESPONSE BY ID (Owner of the test or Admin)
@router.delete("/response/{response_id}")
def delete_response(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_creator_or_admin)
):
    response = db.query(models.Response).filter(models.Response.id == response_id).first()

    if not response or not owns_test(current_user, response.test):
        return not_found("Response not found")

    db.delete(response)
    db.commit()

    return {"message": "Response deleted successfully"}
