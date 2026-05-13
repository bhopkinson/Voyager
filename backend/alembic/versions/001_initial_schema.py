"""initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")

    op.create_table(
        "places",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("google_place_id", sa.String(255), nullable=True),
        sa.Column("location_summary", sa.String(255), nullable=True),
        sa.Column("location", sa.String(512), nullable=True),
        sa.Column(
            "geom",
            geoalchemy2.types.Geometry(geometry_type="POINT", srid=4326),
            nullable=True,
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column("cost", sa.Integer(), nullable=True),
        sa.Column("google_maps_url", sa.String(2048), nullable=True),
        sa.Column("website_url", sa.String(2048), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_places_id"), "places", ["id"])
    op.create_index(op.f("ix_places_name"), "places", ["name"])
    op.create_index(op.f("ix_places_google_place_id"), "places", ["google_place_id"])
    op.create_index(op.f("ix_places_location_summary"), "places", ["location_summary"])

    op.create_table(
        "visits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("place_id", sa.Integer(), nullable=False),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_visits_id"), "visits", ["id"])
    op.create_index(op.f("ix_visits_place_id"), "visits", ["place_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_visits_place_id"), table_name="visits")
    op.drop_index(op.f("ix_visits_id"), table_name="visits")
    op.drop_table("visits")
    op.drop_index(op.f("ix_places_location_summary"), table_name="places")
    op.drop_index(op.f("ix_places_google_place_id"), table_name="places")
    op.drop_index(op.f("ix_places_name"), table_name="places")
    op.drop_index(op.f("ix_places_id"), table_name="places")
    op.drop_table("places")
