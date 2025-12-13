"""Add composite index for documents owner and source file

Revision ID: 20241212_0001
Revises: 20241211_0002_add_refresh_tokens
Create Date: 2024-12-12

Optimizes queries that filter documents by owner_id and source_file,
which are the most common query patterns in the application.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20241212_0001_add_composite_index'
down_revision = '20241211_0002_add_refresh_tokens'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create composite index on documents table for owner_id and source_file.
    
    This improves performance for:
    - Listing user's documents
    - Deleting documents by source file
    - Filtering search results by source files
    """
    # Create composite index for (owner_id, source_file from JSON)
    op.execute('''
        CREATE INDEX IF NOT EXISTS idx_documents_owner_source_file 
        ON documents (owner_id, ((chunk_metadata->>'source_file')));
    ''')
    
    # Create additional index for timestamp-based queries if needed in future
    op.execute('''
        CREATE INDEX IF NOT EXISTS idx_activity_logs_user_timestamp 
        ON activity_logs (user_id, timestamp DESC);
    ''')


def downgrade() -> None:
    """Remove the composite indexes."""
    op.execute('DROP INDEX IF EXISTS idx_documents_owner_source_file;')
    op.execute('DROP INDEX IF EXISTS idx_activity_logs_user_timestamp;')
