"""add_mental_analyses_user_created_index

Revision ID: 0263704fadfa
Revises: bbebd0597dde
Create Date: 2026-02-02 05:04:54.500292

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0263704fadfa'
down_revision: Union[str, None] = 'bbebd0597dde'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add composite index for faster latest analysis queries
    op.create_index(
        'ix_mental_analyses_user_created',
        'mental_analyses',
        ['user_id', sa.text('created_at DESC')],
        unique=False
    )


def downgrade() -> None:
    # Remove composite index
    op.drop_index('ix_mental_analyses_user_created', table_name='mental_analyses')
