"""Add email verification fields to users

Revision ID: h4ih84k3l019
Revises: g3hg73j2k908
Create Date: 2026-02-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "h4ih84k3l019"
down_revision: Union[str, None] = "g3hg73j2k908"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 기존 사용자는 email_verified=True로 설정 (server_default 사용)
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.add_column(
        "users",
        sa.Column("verification_token", sa.String(255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("verification_token_expires_at", sa.DateTime(), nullable=True),
    )

    # 인덱스 추가
    op.create_index(
        "ix_users_verification_token", "users", ["verification_token"]
    )

    # server_default 제거 (새 사용자는 모델 기본값 False 사용)
    op.alter_column("users", "email_verified", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_users_verification_token", table_name="users")
    op.drop_column("users", "verification_token_expires_at")
    op.drop_column("users", "verification_token")
    op.drop_column("users", "email_verified")
