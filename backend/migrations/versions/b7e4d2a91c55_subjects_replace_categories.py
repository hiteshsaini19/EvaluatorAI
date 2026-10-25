"""Subjects replace categories

Creates the subjects catalogue, moves questions from category_id to subject_id
(matched by name, case-insensitive), then drops categories. Questions whose
category has no matching subject keep subject_id = NULL ("Unassigned") so an
Admin can reassign them; no questions are deleted.

Revision ID: b7e4d2a91c55
Revises: 6e2bb0bfabd4
Create Date: 2026-10-24 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.data.subjects import SUBJECTS


# revision identifiers, used by Alembic.
revision: str = 'b7e4d2a91c55'
down_revision: Union[str, Sequence[str], None] = '6e2bb0bfabd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    subjects = op.create_table(
        'subjects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('group_name', sa.String(length=100), nullable=False),
        sa.Column('scope', sa.Text(), nullable=False),
        sa.Column('easy_rubric', sa.Text(), nullable=False),
        sa.Column('medium_rubric', sa.Text(), nullable=False),
        sa.Column('hard_rubric', sa.Text(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
        sa.UniqueConstraint('name'),
    )
    op.create_index(op.f('ix_subjects_id'), 'subjects', ['id'], unique=False)

    # Fill the catalogue now so existing questions can be mapped; seed.py keeps it up to date later
    op.bulk_insert(subjects, [
        {**data, 'sort_order': order, 'is_active': True}
        for order, data in enumerate(SUBJECTS, start=1)
    ])

    op.add_column('questions', sa.Column('subject_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'questions_subject_id_fkey', 'questions', 'subjects',
        ['subject_id'], ['id'], ondelete='SET NULL'
    )

    op.execute("""
        UPDATE questions AS q
        SET subject_id = s.id
        FROM categories AS c, subjects AS s
        WHERE q.category_id = c.id
          AND (lower(c.name) = lower(s.name) OR lower(c.name) = s.slug)
    """)

    # Dropping the column also drops its foreign key to categories
    op.drop_column('questions', 'category_id')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('parent_category', sa.String(length=150), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)

    op.add_column('questions', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'questions_category_id_fkey', 'questions', 'categories',
        ['category_id'], ['id'], ondelete='CASCADE'
    )

    # Recreate one category per subject that has questions, then point questions back at it
    op.execute("""
        INSERT INTO categories (name, parent_category, description, user_id)
        SELECT s.name, NULL, NULL, COALESCE(MIN(q.user_id), (SELECT MIN(id) FROM users))
        FROM subjects AS s
        JOIN questions AS q ON q.subject_id = s.id
        GROUP BY s.id, s.name
    """)
    op.execute("""
        UPDATE questions AS q
        SET category_id = c.id
        FROM subjects AS s, categories AS c
        WHERE q.subject_id = s.id AND c.name = s.name
    """)

    op.drop_constraint('questions_subject_id_fkey', 'questions', type_='foreignkey')
    op.drop_column('questions', 'subject_id')
    op.drop_index(op.f('ix_subjects_id'), table_name='subjects')
    op.drop_table('subjects')
