from sqlalchemy import Column, Integer, String, ForeignKey, Text, TIMESTAMP, Boolean, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

# Role Table
class Role(Base):
    __tablename__= "roles"

    id = Column(Integer, primary_key = True, index = True)
    role_name = Column(String(100), unique = True, nullable = False)

    # Relationship with next table
    # users = relationship("User", back_populates= "role", cascade = "all, delete", passive_deletes = True)


# User Table
class User(Base):
    __tablename__="users"

    id = Column(Integer, primary_key = True, index = True)
    name = Column(String(150), nullable = False)
    email = Column(String(200), unique = True, nullable = False)
    password = Column(Text, nullable = False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete = "CASCADE")) # Foreign Key connectes user to role.id
    created_at = Column(TIMESTAMP(timezone = True), server_default = func.now())

    # Relationship (Access roles)
    role = relationship("Role", backref = "users")


# Subject Table (fixed catalogue, seeded from app/data/subjects.py)
class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(100), unique=True, nullable=False)
    name = Column(String(150), unique=True, nullable=False)
    group_name = Column(String(100), nullable=False)
    scope = Column(Text, nullable=False)  # Topics covered, used in the AI prompt
    easy_rubric = Column(Text, nullable=False)
    medium_rubric = Column(Text, nullable=False)
    hard_rubric = Column(Text, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

# Questions Table (example question bank)
class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)  # NULL = Unassigned
    question_text = Column(Text, nullable=False)
    options = Column(Text, nullable=False)  # Stored as JSON string
    correct_option = Column(String(1), nullable=False)  # Single character: 'a', 'b', 'c', 'd'
    difficulty = Column(String(20), nullable=False)  # 'Easy', 'Medium', 'Hard'
    user_id = Column(Integer, ForeignKey("users.id")) # Foreign key for connecting with user.id
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    subject = relationship("Subject")
    creator = relationship("User", backref="questions")

# Test Table
class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    test_name = Column(String(200), nullable=True)
    test_code = Column(String(100), unique=True, nullable=False, index=True)
    # Snapshot of the questions as a JSON array. Each item: id, source_question_id, subject_id, subject,
    # difficulty, question, options {"A".."D"}, answer, explanation
    questions_data = Column(Text, nullable=False)
    subject_ids = Column(Text, nullable=False)  # JSON array of subject ids, in catalogue order
    difficulties = Column(Text, nullable=False)  # JSON array, e.g. ["Easy", "Hard"]
    num_questions = Column(Integer, nullable=False)  # Number requested when the test was generated
    duration_minutes = Column(Integer, nullable=False)  # Time each candidate gets once they start
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)  # Link stops accepting new candidates
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    creator = relationship("User", backref="tests")

# Candidate Table
class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(200), nullable=False, unique=True)  # Stored lowercase
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # No direct test relationship - candidate can take multiple tests


# Response Table: one attempt of one candidate at one test
class Response(Base):
    __tablename__ = "responses"
    __table_args__ = (UniqueConstraint("test_id", "candidate_id", name="uq_responses_test_candidate"),)

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    test_name = Column(String(200), nullable=True)  # Test name at the time of the attempt
    attempt_token = Column(String(64), unique=True, nullable=False, index=True)  # Candidate's key to the attempt
    status = Column(String(20), nullable=False, default="in_progress")  # in_progress / submitted / timed_out
    answers = Column(Text, nullable=False, default="{}")  # JSON object: snapshot question id -> "A".."D"
    score = Column(Integer, nullable=True)  # Set when the attempt is finalised
    started_at = Column(TIMESTAMP(timezone=True), nullable=False)
    deadline = Column(TIMESTAMP(timezone=True), nullable=False)  # started_at + test duration
    submitted_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # Relationships
    candidate = relationship("Candidate", backref="responses")
    test = relationship("Test", backref="responses")


# Generation Log: one row per test generation, used for the daily AI quotas
class GenerationLog(Base):
    __tablename__ = "generation_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False, index=True)
    source = Column(String(20), nullable=False)  # ai / bank
    status = Column(String(20), nullable=False)  # success / partial / failed
    requested_count = Column(Integer, nullable=False)
    question_count = Column(Integer, nullable=False)  # Questions actually generated
    provider = Column(String(50), nullable=True)
    model = Column(String(100), nullable=True)
    calls = Column(Integer, nullable=False, default=0)  # AI requests made
    duration_ms = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)  # Internal detail when something went wrong
