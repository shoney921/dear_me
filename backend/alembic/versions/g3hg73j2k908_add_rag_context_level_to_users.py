"""Add rag_context_level to users

Revision ID: g3hg73j2k908
Revises: 01507bb61cc3
Create Date: 2026-02-03 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'g3hg73j2k908'
down_revision: Union[str, None] = 'f2gf62i1j897'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('rag_context_level', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'rag_context_level')
