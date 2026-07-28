"""drop unique constraint on username

Revision ID: 9f3c1d2b7a44
Revises: 71689db7a0a3
Create Date: 2026-07-28 17:05:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '9f3c1d2b7a44'
down_revision: Union[str, Sequence[str], None] = '71689db7a0a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint('users_username_key', 'users', type_='unique')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_unique_constraint('users_username_key', 'users', ['username'])
