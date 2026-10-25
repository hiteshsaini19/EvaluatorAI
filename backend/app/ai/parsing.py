# Checks the AI's reply: parses the JSON, enforces the question shape, drops near-duplicates
# and spreads the correct answers evenly across A-D.
import json
import random
import re
from difflib import SequenceMatcher
from typing import Dict, List, Optional, Tuple

LETTERS = ["A", "B", "C", "D"]

# Lazy options the prompt forbids
BANNED_OPTION = re.compile(r"^(all|none|both|neither) of (the )?(above|these|them)\b|^both [a-d] and [a-d]\b", re.IGNORECASE)

MAX_EXPLANATION_WORDS = 40  # The prompt asks for 25; allow some slack, then trim
DUPLICATE_RATIO = 0.88


def extract_json(text: str):
    # Accepts a bare JSON reply, one wrapped in a ```json fence, or text around a JSON object
    text = text.strip()
    fenced = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start:end + 1])
        raise


def normalise(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def is_near_duplicate(text: str, existing: List[str]) -> bool:
    key = normalise(text)
    return any(key == other or SequenceMatcher(None, key, other).ratio() >= DUPLICATE_RATIO for other in existing)


def parse_item(item, subjects_by_name: Dict[str, int]) -> Tuple[Optional[dict], Optional[str]]:
    # Returns (clean question, None) or (None, reason it was rejected)
    if not isinstance(item, dict):
        return None, "not an object"

    subject_id = subjects_by_name.get(str(item.get("subject", "")).strip().lower())
    if subject_id is None:
        return None, f"unknown subject {item.get('subject')!r}"

    difficulty = str(item.get("difficulty", "")).strip().capitalize()
    if difficulty not in ("Easy", "Medium", "Hard"):
        return None, f"unknown difficulty {item.get('difficulty')!r}"

    question = str(item.get("question", "")).strip()
    if len(question) < 10:
        return None, "question text missing or too short"

    options = item.get("options")
    if isinstance(options, list) and len(options) == 4:
        options = dict(zip(LETTERS, options))
    if not isinstance(options, dict):
        return None, "options missing"
    options = {str(k).strip().upper(): ("" if v is None else str(v).strip()) for k, v in options.items()}
    if sorted(options) != LETTERS:
        return None, f"options must be A-D, got {sorted(options)}"
    if any(not value for value in options.values()):
        return None, "empty option"
    if len({normalise(value) for value in options.values()}) < 4:
        return None, "duplicate options"
    if any(BANNED_OPTION.search(value) for value in options.values()):
        return None, "uses 'all/none of the above'"

    answer = str(item.get("answer", "")).strip().upper().rstrip(").")
    if answer not in LETTERS:
        return None, f"answer {item.get('answer')!r} is not A-D"

    explanation = " ".join(str(item.get("explanation", "") or "").split())
    words = explanation.split(" ")
    if len(words) > MAX_EXPLANATION_WORDS:
        explanation = " ".join(words[:MAX_EXPLANATION_WORDS]) + "…"

    return {
        "subject_id": subject_id,
        "difficulty": difficulty,
        "question": question,
        "options": options,
        "answer": answer,
        "explanation": explanation,
    }, None


def parse_reply(text: str, subjects_by_name: Dict[str, int]) -> Tuple[List[dict], List[str]]:
    # Returns (valid questions, reasons for rejected ones). Raises ValueError if the reply isn't usable JSON.
    try:
        data = extract_json(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"reply is not valid JSON: {e}")

    items = data.get("questions") if isinstance(data, dict) else data
    if not isinstance(items, list):
        raise ValueError("reply has no 'questions' list")

    valid, rejected = [], []
    for item in items:
        question, reason = parse_item(item, subjects_by_name)
        if question:
            valid.append(question)
        else:
            rejected.append(reason)
    return valid, rejected


def balance_answers(questions: List[dict], rng: random.Random) -> None:
    # Moves each correct answer to a target letter so A-D are used about equally,
    # and shuffles the wrong options around it
    targets = [LETTERS[i % 4] for i in range(len(questions))]
    rng.shuffle(targets)
    for question, target in zip(questions, targets):
        correct = question["options"][question["answer"]]
        wrong = [v for k, v in question["options"].items() if k != question["answer"]]
        rng.shuffle(wrong)
        values = wrong[:]
        values.insert(LETTERS.index(target), correct)
        question["options"] = dict(zip(LETTERS, values))
        question["answer"] = target
