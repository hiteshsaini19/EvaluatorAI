from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, require_admin
import json

router = APIRouter(prefix="/questions", tags=["Questions"])


def serialize_question(question: models.Question) -> dict:
    subject = question.subject
    return {
        "id": question.id,
        "subject_id": question.subject_id,
        "subject_name": subject.name if subject else "Unassigned",
        "subject_group": subject.group_name if subject else None,
        "question_text": question.question_text,
        "options": json.loads(question.options),
        "correct_option": question.correct_option,
        "difficulty": question.difficulty,
        "user_id": question.user_id,
        "created_at": question.created_at.isoformat(),
    }


def get_active_subject(db: Session, subject_id: int):
    return db.query(models.Subject).filter(
        models.Subject.id == subject_id,
        models.Subject.is_active.is_(True)
    ).first()


def validate_options(options: dict):
    # Returns an error message, or None when valid
    if not options:
        return "options is a required field and cannot be empty"
    for key, value in options.items():
        if not value or not value.strip():
            return f"Option '{key}' cannot be empty"
    return None


def bad_request(message: str):
    return JSONResponse(status_code=400, content={"status": 400, "error": message})


# Create Question - Admin only
@router.post("/", response_model=schemas.QuestionResponse)
def create_question(
    question: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    if not question.question_text or not question.question_text.strip():
        return bad_request("question_text is a required field and cannot be empty")

    options_error = validate_options(question.options)
    if options_error:
        return bad_request(options_error)

    if not question.correct_option or not question.correct_option.strip():
        return bad_request("correct_option is a required field and cannot be empty")

    if not get_active_subject(db, question.subject_id):
        return JSONResponse(status_code=404, content={"status": 404, "error": "Subject not found"})

    if question.correct_option not in question.options:
        return bad_request(f"correct_option '{question.correct_option}' must be one of the option keys")

    if len(question.correct_option) != 1:
        return bad_request("correct_option must be a single character (e.g., 'a', 'b', 'c', 'd')")

    db_question = models.Question(
        subject_id=question.subject_id,
        question_text=question.question_text,
        options=json.dumps(question.options),
        correct_option=question.correct_option,
        difficulty=question.difficulty.value,
        user_id=current_user.id
    )

    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    return serialize_question(db_question)


# Get all questions with optional filters - Any authenticated user
@router.get("/", response_model=schemas.QuestionPaginatedResponse)
def get_questions(
    subject_id: Optional[int] = Query(None, description="Filter by subject ID"),
    group: Optional[str] = Query(None, description="Filter by subject group name"),
    unassigned: bool = Query(False, description="Only questions without a subject"),
    difficulty: Optional[schemas.DifficultyEnum] = Query(None, description="Filter by difficulty: Easy, Medium, or Hard"),
    search: Optional[str] = Query(None, description="Search term for question text"),
    page: int = Query(1, ge=1, description="Page number (starts from 1)"),
    per_page: int = Query(10, ge=1, le=10000, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Question).options(joinedload(models.Question.subject))

    if unassigned:
        query = query.filter(models.Question.subject_id.is_(None))
    elif subject_id is not None:
        query = query.filter(models.Question.subject_id == subject_id)
    elif group:
        query = query.join(models.Subject).filter(models.Subject.group_name == group)

    if difficulty is not None:
        query = query.filter(models.Question.difficulty == difficulty.value)

    if search:
        query = query.filter(models.Question.question_text.ilike(f"%{search}%"))

    total = query.count()

    questions = (
        query.order_by(models.Question.id)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "items": [serialize_question(q) for q in questions],
        "total": total,
        "page": page,
        "per_page": per_page
    }


# Get single question by ID - Any authenticated user
@router.get("/{question_id}", response_model=schemas.QuestionResponse)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_question = db.query(models.Question).filter(
        models.Question.id == question_id
    ).first()

    if not db_question:
        return JSONResponse(status_code=404, content = {
            "status" : 404,
            "error" : "Question not found"
        })

    return serialize_question(db_question)

# Update question - Admin only
@router.put("/{question_id}", response_model=schemas.QuestionResponse)
def update_question(
    question_id: int,
    question: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    db_question = db.query(models.Question).filter(
        models.Question.id == question_id
    ).first()

    if not db_question:
        return JSONResponse(status_code=404, content={
            "status": 404,
            "error": "Question not found"
        })

    if question.question_text is not None:
        if not question.question_text.strip():
            return bad_request("'question_text' cannot be empty")
        db_question.question_text = question.question_text

    if question.options is not None:
        options_error = validate_options(question.options)
        if options_error:
            return bad_request(options_error)

        # Current correct_option must still exist in the new options if it is not being updated
        if question.correct_option is None and db_question.correct_option not in question.options:
            return bad_request(f"Current correct_option '{db_question.correct_option}' must exist in new options")
        db_question.options = json.dumps(question.options)

    if question.correct_option is not None:
        if not question.correct_option.strip():
            return bad_request("'correct_option' cannot be empty")

        if len(question.correct_option) != 1:
            return bad_request("correct_option must be a single character")

        current_options = json.loads(db_question.options)
        if question.correct_option not in current_options:
            return bad_request("correct_option must be one of the option keys")

        db_question.correct_option = question.correct_option

    if question.subject_id is not None:
        if not get_active_subject(db, question.subject_id):
            return JSONResponse(status_code=404, content={
                "status": 404,
                "error": "Subject not found"
            })
        db_question.subject_id = question.subject_id

    if question.difficulty is not None:
        db_question.difficulty = question.difficulty.value

    db.commit()
    db.refresh(db_question)

    return serialize_question(db_question)

# Delete question - Only Admin can delete
@router.delete("/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):

    db_question = db.query(models.Question).filter(
        models.Question.id == question_id
    ).first()

    if not db_question:
        return JSONResponse(status_code=404, content = {
            "status" : 404,
            "error" : "Question not found"
        })

    db.delete(db_question)
    db.commit()

    return {"message": "Question deleted successfully"}
