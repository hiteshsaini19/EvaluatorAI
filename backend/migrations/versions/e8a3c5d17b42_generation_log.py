"""Generation log for AI quotas

One row per test generation (AI or question bank), used to enforce the
per-creator and global daily AI limits and to see how generation is going.

Revision ID: e8a3c5d17b42
Revises: d41f8c2b7a90
Create Date: 2026-10-25 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8a3c5d17b42'
down_revision: Union[str, Sequence[str], None] = 'd41f8c2b7a90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'generation_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('source', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('requested_count', sa.Integer(), nullable=False),
        sa.Column('question_count', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(length=50), nullable=True),
        sa.Column('model', sa.String(length=100), nullable=True),
        sa.Column('calls', sa.Integer(), nullable=False),
        sa.Column('duration_ms', sa.Integer(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_generation_log_id'), 'generation_log', ['id'], unique=False)
    op.create_index(op.f('ix_generation_log_user_id'), 'generation_log', ['user_id'], unique=False)
    op.create_index(op.f('ix_generation_log_created_at'), 'generation_log', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_generation_log_created_at'), table_name='generation_log')
    op.drop_index(op.f('ix_generation_log_user_id'), table_name='generation_log')
    op.drop_index(op.f('ix_generation_log_id'), table_name='generation_log')
    op.drop_table('generation_log')
