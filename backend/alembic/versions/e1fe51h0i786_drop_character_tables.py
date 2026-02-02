"""drop character tables

Revision ID: e1fe51h0i786
Revises: d0ed40g9h675
Create Date: 2026-01-30 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1fe51h0i786'
down_revision: Union[str, None] = 'd0ed40g9h675'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop character_history table first (has FK to characters)
    op.drop_index(op.f('ix_character_history_id'), table_name='character_history')
    op.drop_table('character_history')

    # Drop characters table
    op.drop_index(op.f('ix_characters_id'), table_name='characters')
    op.drop_table('characters')

    # Drop the enum type
    op.execute('DROP TYPE IF EXISTS characterstyle')


def downgrade() -> None:
    # Recreate characterstyle enum
    character_style_enum = sa.Enum(
        'WATERCOLOR', 'ANIME', 'PIXEL', 'THREED', 'REALISTIC', 'CARTOON',
        name='characterstyle'
    )
    character_style_enum.create(op.get_bind())

    # Recreate characters table
    op.create_table('characters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('thumbnail_url', sa.String(length=500), nullable=True),
        sa.Column('style', character_style_enum, nullable=False),
        sa.Column('prompt_used', sa.Text(), nullable=True),
        sa.Column('generation_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index(op.f('ix_characters_id'), 'characters', ['id'], unique=False)

    # Recreate character_history table
    op.create_table('character_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('character_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('style', character_style_enum, nullable=False),
        sa.Column('prompt_used', sa.Text(), nullable=True),
        sa.Column('diary_count_at_generation', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['character_id'], ['characters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_character_history_id'), 'character_history', ['id'], unique=False)
