from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/subjects", tags=["Subjects"])


# Get all active subjects in catalogue order, with example question counts - Any authenticated user
# (The catalogue is fixed and maintained in app/data/subjects.py, so there are no write endpoints.)
@router.get("/", response_model=list[schemas.SubjectResponse])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    question_counts = dict(
        db.query(models.Question.subject_id, func.count(models.Question.id))
        .filter(models.Question.subject_id.isnot(None))
        .group_by(models.Question.subject_id)
        .all()
    )

    subjects = (
        db.query(models.Subject)
        .filter(models.Subject.is_active.is_(True))
        .order_by(models.Subject.sort_order, models.Subject.name)
        .all()
    )

    return [
        schemas.SubjectResponse(
            id=subject.id,
            slug=subject.slug,
            name=subject.name,
            group_name=subject.group_name,
            scope=subject.scope,
            easy_rubric=subject.easy_rubric,
            medium_rubric=subject.medium_rubric,
            hard_rubric=subject.hard_rubric,
            sort_order=subject.sort_order,
            question_count=question_counts.get(subject.id, 0),
        )
        for subject in subjects
    ]
