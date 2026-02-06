"""Add password reset fields to users

Revision ID: i5ji95l4m120
Revises: h4ih84k3l019
Create Date: 2026-02-06 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "i5ji95l4m120"
down_revision: Union[str, None] = "h4ih84k3l019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_reset_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("password_reset_token_expires_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_users_password_reset_token", "users", ["password_reset_token"]
    )


def downgrade() -> None:
    op.drop_index("ix_users_password_reset_token", table_name="users")
    op.drop_column("users", "password_reset_token_expires_at")
    op.drop_column("users", "password_reset_token")
