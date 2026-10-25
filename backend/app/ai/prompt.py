# Builds the AI prompt for one request: the exact count table, each subject's scope and
# difficulty rubrics, and a few example questions from the bank for style.
import json
from typing import Dict, List, Tuple
from app import models

SYSTEM_PROMPT = (
    "You are an expert assessment writer who creates multiple-choice questions for screening job "
    "candidates. Your questions are accurate, unambiguous and have exactly one correct answer that "
    "any expert would agree with. You reply with JSON only."
)

RUBRIC_FIELDS = {"Easy": "easy_rubric", "Medium": "medium_rubric", "Hard": "hard_rubric"}

RULES = """Rules:
1. Each question has exactly 4 options keyed "A", "B", "C" and "D", and exactly one of them is correct.
2. Wrong options must be believable to someone who doesn't know the topic well. Never use "All of the above", "None of the above", "Both A and B" or similar options.
3. No trick wording and no double negatives.
4. Every question is self-contained: include all the code, data or text it needs, and never refer to other questions.
5. Put code, queries and commands in a fenced code block (```language ... ```) inside the question text, kept under 15 lines. Options may use `inline code`.
6. Follow each subject's difficulty definition below exactly.
7. Cover different topics within a subject; never ask two questions about the same fact.
8. "explanation" is one sentence of at most 25 words saying why the correct answer is right.
9. Write "subject" and "difficulty" exactly as they appear in the table."""

OUTPUT_SHAPE = {
    "questions": [{
        "subject": "<subject name from the table>",
        "difficulty": "Easy | Medium | Hard",
        "question": "<question text>",
        "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
        "answer": "<A, B, C or D>",
        "explanation": "<at most 25 words>",
    }]
}


def format_example(example: models.Question, subject_name: str) -> str:
    options = json.loads(example.options)
    lines = [f"[{subject_name} · {example.difficulty}] {example.question_text}"]
    for key in sorted(options):
        lines.append(f"  {key.upper()}) {options[key]}")
    lines.append(f"  Answer: {example.correct_option.upper()}")
    return "\n".join(lines)


def build_prompt(
    cells: List[Tuple[models.Subject, str, int]],
    examples: Dict[Tuple[int, str], List[models.Question]],
    avoid: List[str],
) -> Tuple[str, str]:
    # cells: (subject, difficulty, count) for this request. Returns (system, user) messages.
    total = sum(count for _, _, count in cells)
    parts = [f"Write exactly {total} multiple-choice questions, split exactly like this:", ""]
    parts.append("| Subject | Difficulty | Questions |")
    parts.append("|---|---|---|")
    for subject, difficulty, count in cells:
        parts.append(f"| {subject.name} | {difficulty} | {count} |")
    parts += ["", RULES, "", "Subjects and what each difficulty means:"]

    subjects: Dict[int, Tuple[models.Subject, List[str]]] = {}
    for subject, difficulty, _ in cells:
        subjects.setdefault(subject.id, (subject, []))[1].append(difficulty)
    for subject, difficulties in subjects.values():
        parts += ["", f"## {subject.name}", f"Scope: {subject.scope}"]
        for difficulty in difficulties:
            parts.append(f"{difficulty}: {getattr(subject, RUBRIC_FIELDS[difficulty])}")

    example_texts = [
        format_example(example, subject.name)
        for subject, difficulty, _ in cells
        for example in examples.get((subject.id, difficulty), [])
    ]
    if example_texts:
        parts += ["", "Style examples from our question bank (match their style and level, but do not copy them):", ""]
        parts += [text + "\n" for text in example_texts]

    if avoid:
        parts += ["", "These questions already exist in the test. Do not repeat or closely paraphrase them:"]
        parts += [f"- {text}" for text in avoid]

    parts += ["", "Reply with a JSON object of exactly this shape and nothing else:", json.dumps(OUTPUT_SHAPE, indent=2)]
    return SYSTEM_PROMPT, "\n".join(parts)
