"""add persona customization and notifications

Revision ID: a1b2c3d4e5f6
Revises: d5dd15171f6e
Create Date: 2026-01-21 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'd5dd15171f6e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_public and customization columns to personas table
    op.add_column('personas', sa.Column('is_public', sa.Boolean(), nullable=True, server_default='true'))
    op.add_column('personas', sa.Column('customization', sa.Text(), nullable=True))

    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('related_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_id'), 'notifications', ['id'], unique=False)
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'], unique=False)
    op.create_index('ix_notifications_user_is_read', 'notifications', ['user_id', 'is_read'], unique=False)


def downgrade() -> None:
    # Drop notifications table
    op.drop_index('ix_notifications_user_is_read', table_name='notifications')
    op.drop_index(op.f('ix_notifications_user_id'), table_name='notifications')
    op.drop_index(op.f('ix_notifications_id'), table_name='notifications')
    op.drop_table('notifications')

    # Drop columns from personas table
    op.drop_column('personas', 'customization')
    op.drop_column('personas', 'is_public')
