"""add daily usage table

Revision ID: c9dc39f8g564
Revises: b8cb28e7f453
Create Date: 2026-01-26 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9dc39f8g564'
down_revision: Union[str, None] = 'b8cb28e7f453'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create daily_usage table
    op.create_table('daily_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('usage_date', sa.Date(), nullable=False),
        sa.Column('chat_messages', sa.Integer(), nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_daily_usage_id'), 'daily_usage', ['id'], unique=False)
    op.create_index(op.f('ix_daily_usage_user_id'), 'daily_usage', ['user_id'], unique=False)
    op.create_index(op.f('ix_daily_usage_usage_date'), 'daily_usage', ['usage_date'], unique=False)
    op.create_index('ix_daily_usage_user_date', 'daily_usage', ['user_id', 'usage_date'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_daily_usage_user_date', table_name='daily_usage')
    op.drop_index(op.f('ix_daily_usage_usage_date'), table_name='daily_usage')
    op.drop_index(op.f('ix_daily_usage_user_id'), table_name='daily_usage')
    op.drop_index(op.f('ix_daily_usage_id'), table_name='daily_usage')
    op.drop_table('daily_usage')
