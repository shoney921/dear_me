"""add persona level and quiz answers

Revision ID: b8cb28e7f453
Revises: a7ba17d6e342
Create Date: 2026-01-26 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8cb28e7f453'
down_revision: Union[str, None] = 'a7ba17d6e342'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add level and quiz_answers columns to personas table
    op.add_column('personas', sa.Column('level', sa.String(length=20), nullable=True, server_default='complete'))
    op.add_column('personas', sa.Column('quiz_answers', sa.Text(), nullable=True))

    # Update existing personas to have 'complete' level
    op.execute("UPDATE personas SET level = 'complete' WHERE level IS NULL")


def downgrade() -> None:
    # Drop columns from personas table
    op.drop_column('personas', 'quiz_answers')
    op.drop_column('personas', 'level')
