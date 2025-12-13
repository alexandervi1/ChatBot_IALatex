"""Initial schema - Baseline migration

Revision ID: 0001
Revises: 
Create Date: 2024-12-11

This migration represents the initial database schema as it exists today.
It includes all tables: users, documents, feedback, and activity_logs.

Running this migration on an existing database will be a no-op since tables already exist.
For new databases, it creates the complete schema.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create initial schema if tables don't exist."""
    
    # Create pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('gemini_api_key', sa.String(), nullable=True),
        sa.Column('ai_provider', sa.String(), nullable=True, server_default='gemini'),
        sa.Column('ai_model', sa.String(), nullable=True),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('role', sa.String(), nullable=True, server_default='user'),
        sa.Column('token_usage', sa.Integer(), nullable=True, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True
    )
    op.create_index('ix_users_id', 'users', ['id'], unique=False, if_not_exists=True)
    op.create_index('ix_users_email', 'users', ['email'], unique=True, if_not_exists=True)
    
    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.String(), nullable=False),
        sa.Column('chunk_metadata', sa.JSON(), nullable=False),
        sa.Column('embedding', Vector(384), nullable=True),
        sa.Column('search_vector', postgresql.TSVECTOR(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True
    )
    op.create_index('ix_documents_id', 'documents', ['id'], unique=False, if_not_exists=True)
    
    # Create feedback table
    op.create_table(
        'feedback',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('query', sa.String(), nullable=False),
        sa.Column('answer', sa.String(), nullable=False),
        sa.Column('feedback_type', sa.String(), nullable=False),
        sa.Column('comment', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True
    )
    op.create_index('ix_feedback_id', 'feedback', ['id'], unique=False, if_not_exists=True)
    
    # Create activity_logs table
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('timestamp', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        if_not_exists=True
    )
    op.create_index('ix_activity_logs_id', 'activity_logs', ['id'], unique=False, if_not_exists=True)
    op.create_index('ix_activity_logs_action', 'activity_logs', ['action'], unique=False, if_not_exists=True)
    op.create_index('ix_activity_logs_timestamp', 'activity_logs', ['timestamp'], unique=False, if_not_exists=True)


def downgrade() -> None:
    """Drop all tables (use with caution!)."""
    op.drop_table('activity_logs')
    op.drop_table('feedback')
    op.drop_table('documents')
    op.drop_table('users')
