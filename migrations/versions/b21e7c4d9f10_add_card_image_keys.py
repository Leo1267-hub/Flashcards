"""add image keys to cards

Revision ID: b21e7c4d9f10
Revises: 9f3c1d2b7a44
Create Date: 2026-07-28 19:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b21e7c4d9f10'
down_revision: Union[str, Sequence[str], None] = '9f3c1d2b7a44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('cards', sa.Column('front_image_key', sa.String(length=255), nullable=True))
    op.add_column('cards', sa.Column('back_image_key', sa.String(length=255), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('cards', 'back_image_key')
    op.drop_column('cards', 'front_image_key')
