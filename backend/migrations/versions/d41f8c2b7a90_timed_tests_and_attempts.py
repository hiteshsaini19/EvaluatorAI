"""Timed tests and candidate attempts

Tests get the settings they are generated from (subjects, difficulties, number of
questions, duration, link expiry) and a new question snapshot format with a per-test
question id, subject, difficulty and explanation.

Responses become attempts: a random attempt token, status, start time, deadline,
submit time and answers saved as {question id: option}. One attempt per candidate
per test. time_taken and answered_at are replaced by started_at / submitted_at.

Existing data is converted:
- Existing tests get a duration of max(30, question count) minutes (capped at 180)
  and a link that stays valid for 7 days from the migration.
- Existing responses become submitted attempts. If a candidate submitted the same
  test more than once, only the first submission is kept.

Revision ID: d41f8c2b7a90
Revises: b7e4d2a91c55
Create Date: 2026-10-25 10:00:00.000000

"""
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd41f8c2b7a90'
down_revision: Union[str, Sequence[str], None] = 'b7e4d2a91c55'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DIFFICULTY_ORDER = ["Easy", "Medium", "Hard"]


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()

    # ---------------- tests ----------------
    op.add_column('tests', sa.Column('subject_ids', sa.Text(), nullable=True))
    op.add_column('tests', sa.Column('difficulties', sa.Text(), nullable=True))
    op.add_column('tests', sa.Column('num_questions', sa.Integer(), nullable=True))
    op.add_column('tests', sa.Column('duration_minutes', sa.Integer(), nullable=True))
    op.add_column('tests', sa.Column('expires_at', sa.TIMESTAMP(timezone=True), nullable=True))

    subject_ids_by_name = {
        name.lower(): subject_id
        for subject_id, name in conn.execute(sa.text("SELECT id, name FROM subjects"))
    }
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    durations = {}

    for test_id, questions_data in conn.execute(sa.text("SELECT id, questions_data FROM tests")).fetchall():
        old_questions = json.loads(questions_data or "[]")
        new_questions = []
        seen_ids = set()
        for position, q in enumerate(old_questions, start=1):
            # The old snapshot keyed answers by the bank question id, so keep it as the question id
            question_id = str(q.get("question_id", position))
            while question_id in seen_ids:
                question_id = f"{question_id}-{position}"
            seen_ids.add(question_id)

            subject_name = (q.get("category") or {}).get("name") or "Unassigned"
            new_questions.append({
                "id": question_id,
                "source_question_id": q.get("question_id"),
                "subject_id": subject_ids_by_name.get(subject_name.lower()),
                "subject": subject_name,
                "difficulty": q.get("difficulty") or "Medium",
                "question": q.get("question", ""),
                "options": {str(k).upper(): v for k, v in (q.get("options") or {}).items()},
                "answer": str(q.get("answer", "")).upper(),
                "explanation": "",
            })

        subject_ids = []
        for q in new_questions:
            if q["subject_id"] is not None and q["subject_id"] not in subject_ids:
                subject_ids.append(q["subject_id"])
        difficulties = [d for d in DIFFICULTY_ORDER if any(q["difficulty"] == d for q in new_questions)]
        duration = min(180, max(30, len(new_questions)))
        durations[test_id] = duration

        conn.execute(
            sa.text("""
                UPDATE tests
                SET questions_data = :questions_data, subject_ids = :subject_ids, difficulties = :difficulties,
                    num_questions = :num_questions, duration_minutes = :duration, expires_at = :expires_at
                WHERE id = :id
            """),
            {
                "id": test_id,
                "questions_data": json.dumps(new_questions),
                "subject_ids": json.dumps(subject_ids),
                "difficulties": json.dumps(difficulties or ["Medium"]),
                "num_questions": len(new_questions),
                "duration": duration,
                "expires_at": expires_at,
            },
        )

    for column in ['subject_ids', 'difficulties', 'num_questions', 'duration_minutes', 'expires_at']:
        op.alter_column('tests', column, nullable=False)

    # ---------------- responses ----------------
    # One attempt per candidate per test: keep the first submission of any duplicates
    duplicates = conn.execute(sa.text("""
        DELETE FROM responses AS r
        USING responses AS earlier
        WHERE r.test_id = earlier.test_id
          AND r.candidate_id = earlier.candidate_id
          AND r.id > earlier.id
    """)).rowcount
    if duplicates:
        print(f"Removed {duplicates} repeat submission(s) of the same test by the same candidate.")

    op.add_column('responses', sa.Column('attempt_token', sa.String(length=64), nullable=True))
    op.add_column('responses', sa.Column('status', sa.String(length=20), nullable=True))
    op.add_column('responses', sa.Column('started_at', sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('responses', sa.Column('deadline', sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column('responses', sa.Column('submitted_at', sa.TIMESTAMP(timezone=True), nullable=True))

    rows = conn.execute(sa.text(
        "SELECT id, test_id, answers, time_taken, answered_at FROM responses"
    )).fetchall()
    for response_id, test_id, answers, time_taken, answered_at in rows:
        submitted_at = answered_at or datetime.now(timezone.utc)
        started_at = submitted_at - timedelta(seconds=time_taken or 0)
        deadline = max(started_at + timedelta(minutes=durations.get(test_id, 30)), submitted_at)

        # Old format: [{questionId, selected, correct, isCorrect}] -> {questionId: selected}
        old_answers = json.loads(answers or "[]")
        new_answers = {
            str(a["questionId"]): str(a["selected"]).upper()
            for a in old_answers
            if isinstance(a, dict) and a.get("selected")
        } if isinstance(old_answers, list) else old_answers

        conn.execute(
            sa.text("""
                UPDATE responses
                SET attempt_token = :token, status = 'submitted', started_at = :started_at,
                    deadline = :deadline, submitted_at = :submitted_at, answers = :answers
                WHERE id = :id
            """),
            {
                "id": response_id,
                "token": secrets.token_urlsafe(32),
                "started_at": started_at,
                "deadline": deadline,
                "submitted_at": submitted_at,
                "answers": json.dumps(new_answers),
            },
        )

    for column in ['attempt_token', 'status', 'started_at', 'deadline']:
        op.alter_column('responses', column, nullable=False)
    op.alter_column('responses', 'score', existing_type=sa.Integer(), nullable=True)
    op.create_index(op.f('ix_responses_attempt_token'), 'responses', ['attempt_token'], unique=True)
    op.create_unique_constraint('uq_responses_test_candidate', 'responses', ['test_id', 'candidate_id'])
    op.drop_column('responses', 'time_taken')
    op.drop_column('responses', 'answered_at')


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()

    tests = {
        test_id: (json.loads(questions_data), user_id)
        for test_id, questions_data, user_id in conn.execute(
            sa.text("SELECT id, questions_data, user_id FROM tests")
        ).fetchall()
    }

    def old_question_id(question: dict, position: int) -> int:
        return int(question["id"]) if str(question["id"]).isdigit() else position

    # ---------------- responses ----------------
    # The old schema has no way to store an unfinished attempt
    conn.execute(sa.text("DELETE FROM responses WHERE status = 'in_progress'"))

    op.add_column('responses', sa.Column('time_taken', sa.Integer(), nullable=True))
    op.add_column('responses', sa.Column(
        'answered_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True
    ))

    rows = conn.execute(sa.text(
        "SELECT id, test_id, answers, score, started_at, submitted_at FROM responses"
    )).fetchall()
    for response_id, test_id, answers, score, started_at, submitted_at in rows:
        questions = tests.get(test_id, ([], None))[0]
        saved = json.loads(answers or "{}")
        old_answers = []
        for position, q in enumerate(questions, start=1):
            selected = saved.get(q["id"], "")
            old_answers.append({
                "questionId": str(old_question_id(q, position)),
                "selected": selected,
                "correct": q["answer"],
                "isCorrect": selected == q["answer"],
            })
        submitted_at = submitted_at or started_at
        conn.execute(
            sa.text("""
                UPDATE responses
                SET answers = :answers, score = :score, time_taken = :time_taken, answered_at = :answered_at
                WHERE id = :id
            """),
            {
                "id": response_id,
                "answers": json.dumps(old_answers),
                "score": score if score is not None else sum(a["isCorrect"] for a in old_answers),
                "time_taken": max(0, int((submitted_at - started_at).total_seconds())),
                "answered_at": submitted_at,
            },
        )

    op.alter_column('responses', 'time_taken', nullable=False)
    op.alter_column('responses', 'score', existing_type=sa.Integer(), nullable=False)
    op.drop_constraint('uq_responses_test_candidate', 'responses', type_='unique')
    op.drop_index(op.f('ix_responses_attempt_token'), table_name='responses')
    for column in ['attempt_token', 'status', 'started_at', 'deadline', 'submitted_at']:
        op.drop_column('responses', column)

    # ---------------- tests ----------------
    for test_id, (questions, user_id) in tests.items():
        old_questions = [
            {
                "question_id": old_question_id(q, position),
                "answer": q["answer"],
                "options": q["options"],
                "category": {"id": q.get("subject_id") or 0, "name": q.get("subject") or "Unassigned"},
                "question": q["question"],
                "difficulty": q["difficulty"],
                "user_id": user_id or 0,
            }
            for position, q in enumerate(questions, start=1)
        ]
        conn.execute(
            sa.text("UPDATE tests SET questions_data = :questions_data WHERE id = :id"),
            {"id": test_id, "questions_data": json.dumps(old_questions)},
        )

    for column in ['subject_ids', 'difficulties', 'num_questions', 'duration_minutes', 'expires_at']:
        op.drop_column('tests', column)
