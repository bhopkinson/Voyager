from datetime import datetime, date
from typing import List

from sqlalchemy import (
    Integer,
    String,
    Text,
    DateTime,
    Date,
    ForeignKey,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY
from geoalchemy2 import Geometry


class Base(DeclarativeBase):
    pass


class Place(Base):
    __tablename__ = "places"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    # Google Places unique identifier for this place (if selected from autocomplete)
    google_place_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    # Short human-friendly location summary (e.g., postal town / city)
    location_summary: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # Geometry column: 4326 WGS84, POINT(lon lat)
    geom: Mapped[bytes | None] = mapped_column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[List[str] | None] = mapped_column(ARRAY(String), nullable=True)
    cost: Mapped[int | None] = mapped_column(Integer, nullable=True)
    google_maps_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    visits: Mapped[list["Visit"]] = relationship(
        back_populates="place",
        cascade="all, delete-orphan",
        order_by="Visit.visit_date.desc()",
    )


class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    place_id: Mapped[int] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True)
    visit_date: Mapped[date] = mapped_column(Date, nullable=False)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    place: Mapped[Place] = relationship(back_populates="visits")
