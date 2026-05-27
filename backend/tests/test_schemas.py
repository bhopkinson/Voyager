from __future__ import annotations

from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas import PlaceCreate, PlaceUpdate, VisitCreate


def test_place_create_normalizes_tags_and_location() -> None:
    place = PlaceCreate(
        name="Cafe",
        tags=" Coffee, parks, coffee, ",
        location="51.5, -0.12",
    )

    assert place.tags == ["coffee", "parks"]
    assert place.location == "51.500000,-0.120000"


def test_place_update_accepts_blank_location_as_none() -> None:
    place = PlaceUpdate(location="   ")

    assert place.location is None


@pytest.mark.parametrize("location", ["London", "91,0", "0,181"])
def test_place_location_must_be_valid_lat_lon(location: str) -> None:
    with pytest.raises(ValidationError):
        PlaceCreate(name="Invalid", location=location)


@pytest.mark.parametrize("cost", [-1, 4])
def test_place_cost_is_limited(cost: int) -> None:
    with pytest.raises(ValidationError):
        PlaceCreate(name="Invalid", cost=cost)


@pytest.mark.parametrize("rating", [0, 6])
def test_visit_rating_is_limited(rating: int) -> None:
    with pytest.raises(ValidationError):
        VisitCreate(visit_date=date(2026, 5, 27), rating=rating)
