"""Add diary_embeddings table for RAG

Revision ID: f2gf62i1j897
Revises: 01507bb61cc3
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers, used by Alembic.
revision = "f2gf62i1j897"
down_revision = "01507bb61cc3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # Create diary_embeddings table
    op.create_table(
        "diary_embeddings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("diary_id", sa.Integer(), nullable=False),
        sa.Column("embedding", Vector(768), nullable=False),
        sa.Column("text_hash", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["diary_id"],
            ["diaries.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("diary_id"),
    )
    op.create_index(op.f("ix_diary_embeddings_id"), "diary_embeddings", ["id"], unique=False)

    # Create HNSW index for fast similarity search
    op.execute(
        """
        CREATE INDEX diary_embeddings_embedding_idx
        ON diary_embeddings
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
        """
    )


def downgrade() -> None:
    op.drop_index("diary_embeddings_embedding_idx", table_name="diary_embeddings")
    op.drop_index(op.f("ix_diary_embeddings_id"), table_name="diary_embeddings")
    op.drop_table("diary_embeddings")
