from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from datetime import datetime
from typing import Optional, Dict, List
import json
from enum import Enum

# Login Schema
class UserLogin(BaseModel):
    email: str = Field(..., min_length=1, description="User email address")
    password: str = Field(..., min_length=1, description="User password")

# Public sign-up Schema (always creates a Creator)
class UserSignup(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, description="Full name")
    email: EmailStr
    # bcrypt only uses the first 72 bytes, so cap the length
    password: str = Field(..., min_length=8, max_length=72, description="Password (8-72 characters)")

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()

# Token Response
class Token(BaseModel):
    access_token: str
    token_type: str

# Token Data
class TokenData(BaseModel):
    user_id: Optional[int] = None

# Role Schemas
class RoleBase(BaseModel):
    role_name: str

class RoleCreate(RoleBase):
    role_name: str = Field(..., min_length=1, description="Role name cannot be empty")

class RoleResponse(RoleBase):
    id: int

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    role_id: int = Field(..., description="Role ID (required)")

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    password: str | None = None
    role_id: int | None = None

class UserResponse(UserBase):
    id: int
    role: RoleResponse
    created_at: datetime

    class Config:
        from_attributes = True


# Subject Schemas
class SubjectResponse(BaseModel):
    id: int
    slug: str
    name: str
    group_name: str
    scope: str
    easy_rubric: str
    medium_rubric: str
    hard_rubric: str
    sort_order: int
    question_count: int = 0

    class Config:
        from_attributes = True


# Difficulty Enum
class DifficultyEnum(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"


# Question Schemas
class QuestionBase(BaseModel):
    subject_id: int
    question_text: str
    options: Dict[str, str]  # Example: {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"}
    correct_option: str  # Single character: 'a', 'b', 'c', or 'd'
    difficulty: DifficultyEnum


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    subject_id: Optional[int] = None
    question_text: Optional[str] = None
    options: Optional[Dict[str, str]] = None
    correct_option: Optional[str] = None
    difficulty: Optional[DifficultyEnum] = None

class QuestionResponse(BaseModel):
    id: int
    subject_id: Optional[int] = None  # None = Unassigned
    subject_name: str
    subject_group: Optional[str] = None
    question_text: str
    options: Dict[str, str]  # Will be converted from JSON string
    correct_option: str
    difficulty: str
    user_id: Optional[int] = None
    created_at: datetime


class QuestionPaginatedResponse(BaseModel):
    items: List[Dict]
    total: int
    page: int
    per_page: int


# Test Schemas
class TestGenerate(BaseModel):
    test_name: str = Field(..., min_length=1, max_length=200)
    subject_ids: List[int]
    difficulties: List[DifficultyEnum]
    num_questions: int = Field(..., ge=5, le=100)
    duration_minutes: int = Field(..., ge=5, le=180)
    # Link validity: either a number of hours from now, or a custom expiry date
    valid_hours: Optional[int] = Field(None, ge=1, le=720)
    expires_at: Optional[datetime] = None

    @field_validator("test_name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("test_name cannot be empty")
        return value

    @field_validator("subject_ids")
    @classmethod
    def at_least_one_subject(cls, value: List[int]) -> List[int]:
        value = list(dict.fromkeys(value))  # Drop duplicates, keep order
        if not value:
            raise ValueError("Choose at least one subject")
        return value

    @field_validator("difficulties")
    @classmethod
    def at_least_one_difficulty(cls, value: List[DifficultyEnum]) -> List[DifficultyEnum]:
        if not value:
            raise ValueError("Choose at least one difficulty")
        return value

    @model_validator(mode="after")
    def one_validity(self):
        if (self.valid_hours is None) == (self.expires_at is None):
            raise ValueError("Give either valid_hours or expires_at for the link validity")
        if self.expires_at is not None and self.expires_at.tzinfo is None:
            raise ValueError("expires_at must include a time zone")
        return self


class TestShortfall(BaseModel):
    subject: str
    difficulty: str
    requested: int
    generated: int


class TestGenerateResponse(BaseModel):
    test_id: int
    test_name: str
    test_code: str
    requested_questions: int
    question_count: int
    shortfalls: List[TestShortfall] = []


class TestQuestion(BaseModel):
    id: str
    source_question_id: Optional[int] = None
    subject_id: Optional[int] = None
    subject: str
    difficulty: str
    question: str
    options: Dict[str, str]  # {"A": ..., "B": ..., "C": ..., "D": ...}
    answer: str
    explanation: str = ""


class TestSummary(BaseModel):
    id: int
    test_name: Optional[str] = None
    test_code: str
    subjects: List[str]
    difficulties: List[str]
    num_questions: int  # Requested when generated
    question_count: int  # Questions currently in the test
    duration_minutes: int
    expires_at: datetime
    is_expired: bool
    attempt_count: int
    created_at: datetime


class TestDetailResponse(TestSummary):
    questions: List[TestQuestion]
    # Removing questions is locked once any candidate has started
    is_locked: bool


# CANDIDATE (PUBLIC) SCHEMAS
class PublicTestInfo(BaseModel):
    test_name: Optional[str] = None
    test_code: str
    subjects: List[str]
    question_count: int
    duration_minutes: int
    expires_at: datetime
    is_expired: bool
    server_time: datetime


class AttemptStart(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    email: EmailStr

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("name cannot be empty")
        return value

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.lower()


class AttemptQuestion(BaseModel):
    id: str
    subject: str
    difficulty: str
    question: str
    options: Dict[str, str]


class AttemptState(BaseModel):
    attempt_token: str
    test_name: Optional[str] = None
    test_code: str
    candidate_name: str
    candidate_email: str
    status: str  # in_progress / submitted / timed_out
    questions: List[AttemptQuestion]  # Empty once the attempt is finished
    answers: Dict[str, str]
    question_count: int
    answered_count: int
    duration_minutes: int
    started_at: datetime
    deadline: datetime
    submitted_at: Optional[datetime] = None
    server_time: datetime


class AttemptAnswers(BaseModel):
    # The full set of answers so far: question id -> "A".."D"
    answers: Dict[str, str]


# RESULTS SCHEMAS
# Question Breakdown for Results
class QuestionBreakdown(BaseModel):
    question_id: str
    question_text: str
    selected_option: Optional[str] = None  # None = not answered
    correct_option: str
    is_correct: bool
    options: Dict[str, str]
    difficulty: str
    subject_name: str
    explanation: str = ""


# Attempt detail with score
class CandidateDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    test_id: int
    test_code: str
    test_name: Optional[str] = None
    status: str
    time_used: int
    time_used_formatted: str
    duration_minutes: int
    total_questions: int
    correct_answers: int
    unanswered_count: int
    score: float
    started_at: datetime
    submitted_at: Optional[datetime] = None


# Full Result Response
class CandidateResultResponse(BaseModel):
    candidate: CandidateDetailResponse
    responses: List[QuestionBreakdown]


# Results list item
class CandidateListItem(BaseModel):
    id: int
    name: str
    email: str
    test_code: str
    test_name: Optional[str] = None
    status: str
    score: Optional[str] = None  # "7/10"; None while in progress
    score_percentage: Optional[int] = None
    unanswered_count: int
    time_used_formatted: str
    started_at: datetime
    submitted_at: Optional[datetime] = None
