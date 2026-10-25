# AI generator: fills the blueprint with questions written by the configured AI model.
# A large test is split into several requests (grouped by subject) that run in parallel;
# cells that come back short get one follow-up round. It is still one click for the creator.
import random
from concurrent.futures import ThreadPoolExecutor, wait
from typing import Dict, List, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session
from app import models
from app.ai.client import AIError, chat_json
from app.ai.parsing import balance_answers, is_near_duplicate, normalise, parse_reply
from app.ai.prompt import build_prompt
from app.ai.settings import AISettings
from app.generation import BlueprintCell, GeneratedQuestion, GenerationResult, Shortfall

# A request needs room for this many cells before examples are cut to one per cell
TWO_EXAMPLES_UP_TO_CELLS = 6
# Existing questions listed in a follow-up request, so the model avoids repeats
MAX_AVOID = 40

CellKey = Tuple[int, str]  # (subject id, difficulty)
Request = List[Tuple[models.Subject, str, int]]


def split_requests(cells: List[Tuple[models.Subject, str, int]], per_call: int) -> List[Request]:
    # Packs (subject, difficulty, count) cells into requests of at most `per_call` questions,
    # keeping the blueprint order (so a request mostly covers one or a few subjects).
    # A cell bigger than the remaining room is split across requests.
    requests: List[Request] = []
    current: Request = []
    room = per_call
    for subject, difficulty, count in cells:
        while count > 0:
            take = min(count, room)
            current.append((subject, difficulty, take))
            count -= take
            room -= take
            if room == 0:
                requests.append(current)
                current, room = [], per_call
    if current:
        requests.append(current)
    return requests


class AIGenerator:
    def __init__(self, settings: AISettings):
        self.settings = settings

    def load_examples(self, db: Session, cells: List[BlueprintCell]) -> Dict[CellKey, List[models.Question]]:
        per_cell = 2 if len(cells) <= TWO_EXAMPLES_UP_TO_CELLS else 1
        examples = {}
        for cell in cells:
            examples[(cell.subject.id, cell.difficulty)] = (
                db.query(models.Question)
                .filter(models.Question.subject_id == cell.subject.id, models.Question.difficulty == cell.difficulty)
                .order_by(func.random())
                .limit(per_cell)
                .all()
            )
        return examples

    def run_requests(self, requests: List[Request], examples, avoid: List[str]) -> Tuple[List[str], List[AIError]]:
        # Runs the requests in parallel. Returns (reply texts, errors). Requests that don't finish
        # within the time limit count as timed out.
        replies, errors = [], []
        if not requests:
            return replies, errors

        def run(request: Request) -> str:
            system, user = build_prompt(request, examples, avoid)
            return chat_json(self.settings, system, user)

        pool = ThreadPoolExecutor(max_workers=min(self.settings.max_parallel_calls, len(requests)))
        try:
            futures = [pool.submit(run, request) for request in requests]
            # Requests beyond the parallel limit wait for a free slot, so allow for that
            rounds = -(-len(requests) // self.settings.max_parallel_calls)
            done, not_done = wait(futures, timeout=self.settings.timeout_seconds * rounds + 10)
            for future in futures:
                if future in not_done:
                    errors.append(AIError("timeout", f"No reply within {self.settings.timeout_seconds} seconds"))
                    continue
                try:
                    replies.append(future.result())
                except AIError as e:
                    errors.append(e)
                except Exception as e:  # Never let one request break the whole generation
                    errors.append(AIError("unavailable", f"{type(e).__name__}: {e}"))
        finally:
            pool.shutdown(wait=False, cancel_futures=True)
        return replies, errors

    def generate(self, db: Session, blueprint: List[BlueprintCell]) -> GenerationResult:
        result = GenerationResult(source="ai")
        subjects = {cell.subject.id: cell.subject for cell in blueprint}
        subjects_by_name = {s.name.lower(): s.id for s in subjects.values()}
        needed: Dict[CellKey, int] = {(c.subject.id, c.difficulty): c.count for c in blueprint}
        accepted: Dict[CellKey, List[dict]] = {key: [] for key in needed}
        seen: List[str] = []
        examples = self.load_examples(db, blueprint)

        def collect(replies: List[str]):
            for text in replies:
                try:
                    questions, rejected = parse_reply(text, subjects_by_name)
                except ValueError as e:
                    result.errors.append(f"bad_response: {e}")
                    continue
                if rejected:
                    result.errors.append(f"rejected {len(rejected)}: {'; '.join(sorted(set(rejected)))[:300]}")
                for q in questions:
                    key = (q["subject_id"], q["difficulty"])
                    if key not in needed or len(accepted[key]) >= needed[key]:
                        continue  # Not asked for, or the cell is already full
                    if is_near_duplicate(q["question"], seen):
                        continue
                    accepted[key].append(q)
                    seen.append(normalise(q["question"]))

        def missing_cells() -> List[Tuple[models.Subject, str, int]]:
            return [
                (subjects[sid], difficulty, needed[(sid, difficulty)] - len(accepted[(sid, difficulty)]))
                for (sid, difficulty) in needed
                if len(accepted[(sid, difficulty)]) < needed[(sid, difficulty)]
            ]

        # First round: the whole blueprint
        cells = [(c.subject, c.difficulty, c.count) for c in blueprint]
        requests = split_requests(cells, self.settings.questions_per_call)
        replies, errors = self.run_requests(requests, examples, avoid=[])
        result.calls += len(requests)
        result.errors += [f"{e.kind}: {e.detail}" for e in errors]
        collect(replies)

        # Nothing came back (wrong key, quota used up, service down or too slow): report it
        # rather than retrying, which would only use more quota and double the wait
        if not replies and errors:
            error = next((e for e in errors if e.fatal), errors[0])
            error.calls = result.calls
            raise error

        # One follow-up round for just the cells that are short, unless the provider refused requests
        missing = missing_cells()
        if missing and not any(e.fatal or e.kind == "quota" for e in errors):
            avoid = [q["question"].splitlines()[0][:120] for qs in accepted.values() for q in qs][:MAX_AVOID]
            requests = split_requests(missing, self.settings.questions_per_call)
            replies, errors = self.run_requests(requests, examples, avoid)
            result.calls += len(requests)
            result.errors += [f"{e.kind}: {e.detail}" for e in errors]
            collect(replies)

        all_questions = [q for c in blueprint for q in accepted[(c.subject.id, c.difficulty)]]

        balance_answers(all_questions, random.Random())
        result.questions = [
            GeneratedQuestion(
                subject_id=q["subject_id"],
                subject=subjects[q["subject_id"]].name,
                difficulty=q["difficulty"],
                question=q["question"],
                options=q["options"],
                answer=q["answer"],
                explanation=q["explanation"],
            )
            for q in all_questions
        ]
        result.shortfalls = [
            Shortfall(subject=subject.name, difficulty=difficulty, requested=needed[(subject.id, difficulty)],
                      generated=needed[(subject.id, difficulty)] - short)
            for subject, difficulty, short in missing_cells()
        ]
        return result
