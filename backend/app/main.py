from __future__ import annotations

import os
import re
from typing import List, Optional, Tuple

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from geoalchemy2.elements import WKTElement
from geopy.geocoders import Nominatim

from .models import Base
from . import crud, schemas


DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@db:5432/voyager"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="Voyager API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def on_startup() -> None:
    # Ensure PostGIS extension is available and create tables
    with engine.begin() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        except Exception:
            # Ignore if not permitted (e.g., non-superuser). The image sets it up.
            pass
        # Idempotent migration for newly added columns
        conn.execute(text("ALTER TABLE IF EXISTS places ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255) NULL"))
        conn.execute(text("ALTER TABLE IF EXISTS places ADD COLUMN IF NOT EXISTS location_summary VARCHAR(255) NULL"))
        conn.execute(text("ALTER TABLE IF EXISTS places ADD COLUMN IF NOT EXISTS google_maps_url TEXT NULL"))
        conn.execute(text("ALTER TABLE IF EXISTS places ADD COLUMN IF NOT EXISTS website_url TEXT NULL"))
    Base.metadata.create_all(bind=engine)


@app.get("/", tags=["meta"])
def read_root():
    return {"message": "Voyager API"}


# Geocoding utilities
_LAT_LON_RE = re.compile(r"^\s*([+-]?[0-9]*\.?[0-9]+)\s*,\s*([+-]?[0-9]*\.?[0-9]+)\s*$")


def parse_lat_lon(text_value: str) -> Optional[Tuple[float, float]]:
    match = _LAT_LON_RE.match(text_value or "")
    if match:
        lat = float(match.group(1))
        lon = float(match.group(2))
        return lat, lon
    return None


def geocode_to_point_wkt(location: Optional[str]) -> Optional[WKTElement]:
    if not location:
        return None
    parsed = parse_lat_lon(location)
    if parsed:
        lat, lon = parsed
        return WKTElement(f"POINT({lon} {lat})", srid=4326)

    # If not lat,lon, we no longer attempt geocoding; validation in schema enforces lat,lon only now
    return None


@app.post("/places", response_model=schemas.Place, tags=["places"], status_code=201)
def create_place(place_in: schemas.PlaceCreate, db: Session = Depends(get_db)):
    geom = geocode_to_point_wkt(place_in.location)
    place = crud.create_place(db, place_in, geom)
    return place


@app.get("/places", response_model=List[schemas.Place], tags=["places"])
def list_all_places(
    db: Session = Depends(get_db),
    text_search: Optional[str] = None,
    max_cost: Optional[int] = Query(default=None, ge=0, le=3),
    tags: Optional[List[str]] = Query(default=None),
    distance_from: Optional[str] = Query(default=None, description="lat,lon"),
    radius_km: float = Query(default=50.0, gt=0),
):
    # Accept comma-delimited tags as well
    tags_any: Optional[List[str]] = tags
    if tags and len(tags) == 1 and "," in tags[0]:
        tags_any = [t.strip() for t in tags[0].split(",") if t.strip()]

    origin_lat_lon: Optional[Tuple[float, float]] = None
    if distance_from:
        parsed = parse_lat_lon(distance_from)
        if not parsed:
            raise HTTPException(status_code=400, detail="distance_from must be 'lat,lon'")
        origin_lat_lon = parsed

    places = crud.list_places(
        db,
        text_search=text_search,
        max_cost=max_cost,
        tags_any=tags_any,
        distance_origin=origin_lat_lon,
        radius_km=radius_km,
    )
    return places


@app.get("/places/{place_id}", response_model=schemas.Place, tags=["places"])
def get_place(place_id: int, db: Session = Depends(get_db)):
    place = crud.get_place(db, place_id)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


@app.put("/places/{place_id}", response_model=schemas.Place, tags=["places"])
def update_place(place_id: int, place_in: schemas.PlaceUpdate, db: Session = Depends(get_db)):
    geom = None
    if place_in.location is not None:
        geom = geocode_to_point_wkt(place_in.location)
    place = crud.update_place(db, place_id, place_in, geom)
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")
    return place


@app.delete("/places/{place_id}", status_code=204, tags=["places"])
def delete_place(place_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_place(db, place_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Place not found")
    return None


@app.post("/places/{place_id}/visits", response_model=schemas.Visit, status_code=201, tags=["visits"])
def add_visit(place_id: int, visit_in: schemas.VisitCreate, db: Session = Depends(get_db)):
    visit = crud.create_visit(db, place_id, visit_in)
    if not visit:
        raise HTTPException(status_code=404, detail="Place not found")
    return visit


@app.put("/visits/{visit_id}", response_model=schemas.Visit, tags=["visits"])
def update_visit(visit_id: int, visit_in: schemas.VisitUpdate, db: Session = Depends(get_db)):
    visit = crud.update_visit(db, visit_id, visit_in)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit


@app.delete("/visits/{visit_id}", status_code=204, tags=["visits"])
def delete_visit(visit_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_visit(db, visit_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Visit not found")
    return None


@app.get("/tags", response_model=List[str], tags=["meta"])
def list_tags(db: Session = Depends(get_db)) -> List[str]:
    rows = db.execute(text("""
        select lower(tag) as tag
        from (
            select distinct unnest(tags) as tag from places where tags is not null
        ) s
        group by lower(tag)
        order by tag
        limit 10
    """)).scalars().all()
    return rows
