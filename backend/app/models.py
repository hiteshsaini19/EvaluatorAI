from sqlalchemy import Column, Integer, String, ForeignKey, Text, TIMESTAMP, Boolean, func
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
    questions_data = Column(Text, nullable=False)  # Stores complete question data as JSON array
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    creator = relationship("User", backref="tests")

# Candidate Table (UPDATED
class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(200), nullable=False, unique=True)  # Make email unique
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # No direct test relationship - candidate can take multiple tests


# Response Table (UPDATED - Add time_taken)
class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False)
    test_name = Column(String(200), nullable=True)  # Added to store test name at time of submission
    answers = Column(Text, nullable=False)
    score = Column(Integer, nullable=False)
    time_taken = Column(Integer, nullable=False)  # Moved here from candidates
    answered_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    # Relationships
    candidate = relationship("Candidate", backref="responses")
    test = relationship("Test", backref="responses")