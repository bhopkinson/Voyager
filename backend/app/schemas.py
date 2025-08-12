from __future__ import annotations

from datetime import datetime, date
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, HttpUrl
import re


# Visit Schemas
class VisitBase(BaseModel):
    visit_date: date
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None


class VisitCreate(VisitBase):
    pass


class VisitUpdate(BaseModel):
    visit_date: Optional[date] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None


class Visit(VisitBase):
    id: int

    class Config:
        from_attributes = True


# Place Schemas
class PlaceBase(BaseModel):
    name: str
    google_place_id: Optional[str] = None
    location_summary: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    cost: Optional[int] = Field(default=None, ge=0, le=3)
    google_maps_url: Optional[HttpUrl] = None
    website_url: Optional[HttpUrl] = None

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v):
        if v is None:
            return None
        # Accept comma string or list
        items: List[str]
        if isinstance(v, str):
            items = [part.strip() for part in v.split(",")]
        else:
            items = list(v)
        normalized: List[str] = []
        seen = set()
        for item in items:
            if item is None:
                continue
            t = str(item).strip().lower()
            if not t:
                continue
            if t not in seen:
                seen.add(t)
                normalized.append(t)
        return normalized

    @field_validator("location", mode="before")
    @classmethod
    def validate_location_lat_lon(cls, v):
        if v is None:
            return None
        s = str(v).strip()
        if s == "":
            return None
        m = re.match(r"^\s*([+-]?[0-9]*\.?[0-9]+)\s*,\s*([+-]?[0-9]*\.?[0-9]+)\s*$", s)
        if not m:
            raise ValueError("location must be 'lat,lon'")
        lat = float(m.group(1))
        lon = float(m.group(2))
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            raise ValueError("location lat or lon out of range")
        # normalize to simple 'lat,lon' string with up to 6 decimals
        return f"{lat:.6f},{lon:.6f}"


class PlaceCreate(PlaceBase):
    pass


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    google_place_id: Optional[str] = None
    location_summary: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    cost: Optional[int] = Field(default=None, ge=0, le=3)
    google_maps_url: Optional[HttpUrl] = None
    website_url: Optional[HttpUrl] = None

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v):
        if v is None:
            return None
        items: List[str]
        if isinstance(v, str):
            items = [part.strip() for part in v.split(",")]
        else:
            items = list(v)
        normalized: List[str] = []
        seen = set()
        for item in items:
            if item is None:
                continue
            t = str(item).strip().lower()
            if not t:
                continue
            if t not in seen:
                seen.add(t)
                normalized.append(t)
        return normalized

    @field_validator("location", mode="before")
    @classmethod
    def validate_location_lat_lon(cls, v):
        if v is None:
            return None
        s = str(v).strip()
        if s == "":
            return None
        m = re.match(r"^\s*([+-]?[0-9]*\.?[0-9]+)\s*,\s*([+-]?[0-9]*\.?[0-9]+)\s*$", s)
        if not m:
            raise ValueError("location must be 'lat,lon'")
        lat = float(m.group(1))
        lon = float(m.group(2))
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0):
            raise ValueError("location lat or lon out of range")
        return f"{lat:.6f},{lon:.6f}"


class Place(PlaceBase):
    id: int
    created_at: datetime
    visits: List[Visit] = Field(default_factory=list)

    class Config:
        from_attributes = True
