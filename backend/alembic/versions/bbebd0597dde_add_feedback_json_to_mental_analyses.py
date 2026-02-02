"""add_feedback_json_to_mental_analyses

Revision ID: bbebd0597dde
Revises: e1fe51h0i786
Create Date: 2026-02-02 05:03:16.481491

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bbebd0597dde'
down_revision: Union[str, None] = 'e1fe51h0i786'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add feedback_json column to mental_analyses table
    op.add_column('mental_analyses', sa.Column('feedback_json', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove feedback_json column
    op.drop_column('mental_analyses', 'feedback_json')
