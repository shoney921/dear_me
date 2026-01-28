"""add mental care tables

Revision ID: d0ed40g9h675
Revises: c9dc39f8g564
Create Date: 2026-01-28 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd0ed40g9h675'
down_revision: Union[str, None] = 'c9dc39f8g564'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create mental_analyses table
    op.create_table('mental_analyses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('diary_id', sa.Integer(), nullable=True),
        sa.Column('stress_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('anxiety_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('depression_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('self_esteem_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('positivity_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('social_connection_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('overall_status', sa.String(20), nullable=True, server_default='neutral'),
        sa.Column('ai_analysis_raw', sa.Text(), nullable=True),
        sa.Column('analysis_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['diary_id'], ['diaries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mental_analyses_id'), 'mental_analyses', ['id'], unique=False)
    op.create_index(op.f('ix_mental_analyses_user_id'), 'mental_analyses', ['user_id'], unique=False)
    op.create_index(op.f('ix_mental_analyses_analysis_date'), 'mental_analyses', ['analysis_date'], unique=False)

    # Create mental_reports table
    op.create_table('mental_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('report_type', sa.String(20), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('avg_stress_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('avg_anxiety_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('avg_depression_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('avg_self_esteem_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('avg_positivity_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('avg_social_connection_score', sa.Integer(), nullable=True, server_default='50'),
        sa.Column('trend', sa.String(20), nullable=True, server_default='stable'),
        sa.Column('insights', sa.Text(), nullable=True),
        sa.Column('recommendations', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_mental_reports_id'), 'mental_reports', ['id'], unique=False)
    op.create_index(op.f('ix_mental_reports_user_id'), 'mental_reports', ['user_id'], unique=False)
    op.create_index('ix_mental_reports_user_type_period', 'mental_reports', ['user_id', 'report_type', 'period_start'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_mental_reports_user_type_period', table_name='mental_reports')
    op.drop_index(op.f('ix_mental_reports_user_id'), table_name='mental_reports')
    op.drop_index(op.f('ix_mental_reports_id'), table_name='mental_reports')
    op.drop_table('mental_reports')

    op.drop_index(op.f('ix_mental_analyses_analysis_date'), table_name='mental_analyses')
    op.drop_index(op.f('ix_mental_analyses_user_id'), table_name='mental_analyses')
    op.drop_index(op.f('ix_mental_analyses_id'), table_name='mental_analyses')
    op.drop_table('mental_analyses')
