# Test generation: turns the creator's choices into an exact question plan (the blueprint)
# and fills it through a generator. The bank generator picks random example questions;
# the AI generator plugs in behind the same interface.
import json
from dataclasses import dataclass, field
from typing import List, Optional, Protocol
from sqlalchemy import func
from sqlalchemy.orm import Session
from app import models

DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"]


@dataclass
class BlueprintCell:
    subject: models.Subject
    difficulty: str
    count: int


@dataclass
class GeneratedQuestion:
    subject_id: int
    subject: str
    difficulty: str
    question: str
    options: dict  # {"A": ..., "B": ..., "C": ..., "D": ...}
    answer: str  # "A".."D"
    explanation: str = ""
    source_question_id: Optional[int] = None


@dataclass
class Shortfall:
    subject: str
    difficulty: str
    requested: int
    generated: int


@dataclass
class GenerationResult:
    questions: List[GeneratedQuestion] = field(default_factory=list)
    shortfalls: List[Shortfall] = field(default_factory=list)


def split_evenly(total: int, parts: int, start: int = 0) -> List[int]:
    # Splits total into `parts` near-equal shares. The leftovers go to the first shares,
    # counting from `start` (wrapping around), so callers can rotate who gets the extra.
    base, extra = divmod(total, parts)
    shares = [base] * parts
    for i in range(extra):
        shares[(start + i) % parts] += 1
    return shares


def build_blueprint(subjects: List[models.Subject], difficulties: List[str], num_questions: int) -> List[BlueprintCell]:
    # N is split evenly across subjects (leftovers to the first subjects), then each subject's share
    # evenly across the difficulties. Leftover difficulty slots rotate from subject to subject, so a
    # test with many subjects doesn't end up skewed towards the first difficulty.
    cells = []
    subject_shares = split_evenly(num_questions, len(subjects))
    rotation = 0
    for subject, share in zip(subjects, subject_shares):
        difficulty_shares = split_evenly(share, len(difficulties), start=rotation)
        rotation = (rotation + share % len(difficulties)) % len(difficulties)
        for difficulty, count in zip(difficulties, difficulty_shares):
            if count > 0:
                cells.append(BlueprintCell(subject=subject, difficulty=difficulty, count=count))
    return cells


class Generator(Protocol):
    def generate(self, db: Session, blueprint: List[BlueprintCell]) -> GenerationResult: ...


class BankGenerator:
    # Picks random questions from the example bank for each cell. If the bank has fewer
    # questions than a cell needs, it returns what it has and reports the shortfall.

    def generate(self, db: Session, blueprint: List[BlueprintCell]) -> GenerationResult:
        result = GenerationResult()
        for cell in blueprint:
            rows = (
                db.query(models.Question)
                .filter(
                    models.Question.subject_id == cell.subject.id,
                    models.Question.difficulty == cell.difficulty,
                )
                .order_by(func.random())
                .limit(cell.count)
                .all()
            )
            for row in rows:
                options = {key.upper(): value for key, value in json.loads(row.options).items()}
                result.questions.append(GeneratedQuestion(
                    subject_id=cell.subject.id,
                    subject=cell.subject.name,
                    difficulty=cell.difficulty,
                    question=row.question_text,
                    options=options,
                    answer=row.correct_option.upper(),
                    source_question_id=row.id,
                ))
            if len(rows) < cell.count:
                result.shortfalls.append(Shortfall(
                    subject=cell.subject.name,
                    difficulty=cell.difficulty,
                    requested=cell.count,
                    generated=len(rows),
                ))
        return result


def get_generator() -> Generator:
    return BankGenerator()
