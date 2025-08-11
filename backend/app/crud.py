from __future__ import annotations

from typing import List, Optional, Tuple

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload
from geoalchemy2.elements import WKTElement

from .models import Place, Visit
from .schemas import PlaceCreate, PlaceUpdate, VisitCreate


def create_place(
    db: Session,
    place_in: PlaceCreate,
    geom_point_wkt: Optional[WKTElement],
) -> Place:
    place = Place(
        name=place_in.name,
        location=place_in.location,
        description=place_in.description,
        tags=place_in.tags,
        cost=place_in.cost,
        google_maps_url=str(place_in.google_maps_url) if place_in.google_maps_url else None,
        website_url=str(place_in.website_url) if place_in.website_url else None,
        geom=geom_point_wkt,
    )
    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def list_places(
    db: Session,
    *,
    text_search: Optional[str] = None,
    max_cost: Optional[int] = None,
    tags_any: Optional[List[str]] = None,
    distance_origin: Optional[Tuple[float, float]] = None,  # (lat, lon)
    radius_km: float = 50.0,
) -> list[Place]:
    query = select(Place).options(joinedload(Place.visits))

    conditions = []

    if text_search:
        like = f"%{text_search}%"
        conditions.append(or_(Place.name.ilike(like), Place.description.ilike(like)))

    if max_cost is not None:
        # Include items where cost is unknown (NULL)
        conditions.append(or_(Place.cost <= max_cost, Place.cost.is_(None)))

    if tags_any:
        # Array overlap: any shared tag
        conditions.append(Place.tags.op("&&")(tags_any))

    if distance_origin is not None:
        lat, lon = distance_origin
        radius_meters = radius_km * 1000.0
        # ST_DWithin(geography(geom), geography(Point), radius_meters)
        conditions.append(
            func.ST_DWithin(
                func.Geography(Place.geom),
                func.Geography(func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)),
                radius_meters,
            )
        )

    if conditions:
        query = query.where(and_(*conditions))

    query = query.order_by(Place.created_at.desc())

    result = db.execute(query)
    return list(result.unique().scalars().all())


def get_place(db: Session, place_id: int) -> Optional[Place]:
    query = (
        select(Place)
        .options(joinedload(Place.visits))
        .where(Place.id == place_id)
        .limit(1)
    )
    result = db.execute(query)
    return result.unique().scalars().first()


def update_place(db: Session, place_id: int, place_in: PlaceUpdate, geom_point_wkt: Optional[WKTElement]) -> Optional[Place]:
    place = db.get(Place, place_id)
    if not place:
        return None

    if place_in.name is not None:
        place.name = place_in.name
    if place_in.location is not None:
        place.location = place_in.location
    if place_in.description is not None:
        place.description = place_in.description
    if place_in.tags is not None:
        place.tags = place_in.tags
    if place_in.cost is not None:
        place.cost = place_in.cost
    if place_in.google_maps_url is not None:
        place.google_maps_url = str(place_in.google_maps_url)
    if place_in.website_url is not None:
        place.website_url = str(place_in.website_url)
    if geom_point_wkt is not None:
        place.geom = geom_point_wkt

    db.add(place)
    db.commit()
    db.refresh(place)
    return place


def delete_place(db: Session, place_id: int) -> bool:
    place = db.get(Place, place_id)
    if not place:
        return False
    db.delete(place)
    db.commit()
    return True


def create_visit(db: Session, place_id: int, visit_in: VisitCreate) -> Optional[Visit]:
    place = db.get(Place, place_id)
    if not place:
        return None
    visit = Visit(
        place_id=place_id,
        visit_date=visit_in.visit_date,
        rating=visit_in.rating,
        notes=visit_in.notes,
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit
