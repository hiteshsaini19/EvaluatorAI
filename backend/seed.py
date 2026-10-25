import json
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Role, User, Subject, Question
from app.auth import hash_password
from app.data.subjects import SUBJECTS
from app.data.example_questions import EXAMPLE_QUESTIONS

OPTION_KEYS = ["a", "b", "c", "d"]


def seed_roles(db: Session):
    roles = ["Admin", "Creator"]
    for role_name in roles:
        existing_role = db.query(Role).filter(Role.role_name == role_name).first()
        if not existing_role:
            db.add(Role(role_name=role_name))
            print(f"Role '{role_name}' created.")
        else:
            print(f"Role '{role_name}' already exists.")
    db.commit()


def seed_users(db: Session):
    # Demo accounts. Change these passwords before any real deployment.
    users_data = [
        {"email": "admin@gmail.com", "name": "Admin User", "password": "admin123", "role_name": "Admin"},
        {"email": "creator@gmail.com", "name": "Creator User", "password": "creator123", "role_name": "Creator"},
    ]

    for user in users_data:
        existing_user = db.query(User).filter(User.email == user["email"]).first()
        if existing_user:
            print(f"User '{user['email']}' already exists.")
            continue

        role = db.query(Role).filter(Role.role_name == user["role_name"]).first()
        if not role:
            print(f"Error: Role '{user['role_name']}' not found for user '{user['email']}'. Skipping.")
            continue

        db.add(User(
            email=user["email"],
            name=user["name"],
            password=hash_password(user["password"]),
            role_id=role.id
        ))
        print(f"User '{user['email']}' created.")
    db.commit()


def seed_subjects(db: Session):
    # Insert new subjects and update existing ones by slug, so editing app/data/subjects.py
    # and re-running the seed updates scopes and rubrics.
    created = updated = 0
    for order, data in enumerate(SUBJECTS, start=1):
        fields = {**data, "sort_order": order, "is_active": True}
        subject = db.query(Subject).filter(Subject.slug == data["slug"]).first()
        if not subject:
            db.add(Subject(**fields))
            created += 1
            continue

        changed = False
        for key, value in fields.items():
            if getattr(subject, key) != value:
                setattr(subject, key, value)
                changed = True
        updated += changed

    # Subjects removed from the catalogue are deactivated, not deleted (questions may reference them)
    catalogue_slugs = {data["slug"] for data in SUBJECTS}
    deactivated = 0
    for subject in db.query(Subject).filter(Subject.is_active.is_(True)).all():
        if subject.slug not in catalogue_slugs:
            subject.is_active = False
            deactivated += 1

    db.commit()
    print(f"Subjects: {created} created, {updated} updated, {deactivated} deactivated.")


def seed_example_questions(db: Session):
    admin = db.query(User).join(Role).filter(Role.role_name == "Admin").order_by(User.id).first()
    if not admin:
        print("Error: No Admin user found. Cannot seed example questions.")
        return

    subjects_by_slug = {s.slug: s for s in db.query(Subject).all()}
    created = 0

    for index, item in enumerate(EXAMPLE_QUESTIONS):
        subject = subjects_by_slug.get(item["subject"])
        if not subject:
            print(f"Warning: unknown subject '{item['subject']}' in example questions. Skipping.")
            continue

        exists = db.query(Question.id).filter(
            Question.subject_id == subject.id,
            Question.question_text == item["question"]
        ).first()
        if exists:
            continue

        # Rotate the correct answer's position so answer letters are evenly spread
        correct_index = index % 4
        option_values = list(item["incorrect"])
        option_values.insert(correct_index, item["correct"])
        options = dict(zip(OPTION_KEYS, option_values))

        db.add(Question(
            subject_id=subject.id,
            question_text=item["question"],
            options=json.dumps(options),
            correct_option=OPTION_KEYS[correct_index],
            difficulty=item["difficulty"],
            user_id=admin.id
        ))
        created += 1

    db.commit()
    print(f"Example questions: {created} created ({len(EXAMPLE_QUESTIONS) - created} already present or skipped).")


def seed():
    db = SessionLocal()
    try:
        print("Starting database seed...")
        seed_roles(db)
        seed_users(db)
        seed_subjects(db)
        seed_example_questions(db)
        print("Database seeded successfully!")
    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
