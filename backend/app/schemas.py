from pydantic import BaseModel, Field, EmailStr, field_validator
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


class QuestionCategory(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


# Test Schemas
class TestQuestionData(BaseModel):
    question_id: int
    answer: str
    options: Dict[str, str]  # e.g., {"A": "Option A", "B": "Option B", ...}
    category: QuestionCategory
    question: str
    difficulty: str  # "Easy", "Medium", "Hard"
    user_id: int

# Test Create Schema
class TestCreate(BaseModel):
    test_name: Optional[str] = None
    questions: List[TestQuestionData]


# Test Response Schema
class TestResponse(BaseModel):
    test_id: int
    test_name: Optional[str] = None
    test_code: str
    question_count: int
    
    class Config:
        from_attributes = True

# Test Detail Response Schema
class TestDetailResponse(BaseModel):
    id: int
    test_name: Optional[str] = None
    test_code: str
    questions_data: List[TestQuestionData]  # Returns the complete question array
    user_id: int
    candidate_count: Optional[int] = 0
    created_at: datetime
    
    class Config:
        from_attributes = True

# CANDIDATE & RESPONSE SCHEMAS
# Individual Answer Item
class AnswerItem(BaseModel):
    questionId: str
    selected: str

# Answer with validation result
class AnswerWithValidation(BaseModel):
    questionId: str
    selected: str
    correct: str
    isCorrect: bool

# Candidate Submission
class CandidateCreate(BaseModel):
    testId: str
    name: str
    email: EmailStr
    timeTaken: int
    answers: List[AnswerItem]

# Public Test View (For Candidates)
class PublicTestQuestion(BaseModel):
    question_id: int
    question: str
    options: Dict[str, str]
    difficulty: str
    category_name: str

class PublicTestResponse(BaseModel):
    test_name: Optional[str] = None
    test_code: str
    questions: List[PublicTestQuestion]

# Basic Candidate Response
class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Question Breakdown for Results
class QuestionBreakdown(BaseModel):
    question_id: str
    question_text: str
    selected_option: str
    correct_option: str
    is_correct: bool
    options: Dict[str, str]
    difficulty: str
    category_name: str

# Candidate Detail with Score
class CandidateDetailResponse(BaseModel):
    id: int
    name: str
    email: str
    test_id: int
    test_code: str
    test_name: Optional[str] = None
    time_taken: int
    time_taken_formatted: str
    total_questions: int
    correct_answers: int
    score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Full Result Response
class CandidateResultResponse(BaseModel):
    candidate: CandidateDetailResponse
    responses: List[QuestionBreakdown]


# Dashboard List Item
class CandidateListItem(BaseModel):
    id: int
    name: str
    email: str
    test_code: str
    test_name: Optional[str] = None
    score: str
    score_percentage: int
    time_taken_formatted: str
    created_at: datetime