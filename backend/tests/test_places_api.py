from __future__ import annotations

from fastapi.testclient import TestClient


def _create_place(client: TestClient, **overrides):
    payload = {
        "name": "London Cafe",
        "location": "51.507400,-0.127800",
        "location_summary": "London",
        "description": "Coffee near the river",
        "tags": ["coffee"],
        "cost": 1,
    }
    payload.update(overrides)
    response = client.post("/places", json=payload)
    assert response.status_code == 201
    return response.json()


def test_create_get_update_and_delete_place(client: TestClient) -> None:
    created = _create_place(client, tags=["Coffee", "views", "coffee"])

    assert created["name"] == "London Cafe"
    assert created["location"] == "51.507400,-0.127800"
    assert created["tags"] == ["coffee", "views"]
    assert created["visits"] == []

    fetched = client.get(f"/places/{created['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["id"] == created["id"]

    updated = client.put(
        f"/places/{created['id']}",
        json={"name": "Updated Cafe", "cost": 2},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Cafe"
    assert updated.json()["cost"] == 2

    deleted = client.delete(f"/places/{created['id']}")
    assert deleted.status_code == 204

    missing = client.get(f"/places/{created['id']}")
    assert missing.status_code == 404


def test_list_places_filters_by_text_cost_tags_and_distance(client: TestClient) -> None:
    museum = _create_place(
        client,
        name="Free Museum",
        description="Ancient history",
        tags=["culture"],
        cost=0,
        location="51.500700,-0.124600",
    )
    park = _create_place(
        client,
        name="Unknown Park",
        description="Green space",
        tags=["outdoors"],
        cost=None,
        location="51.501000,-0.141600",
    )
    dinner = _create_place(
        client,
        name="Fancy Dinner",
        description="Tasting menu",
        tags=["food"],
        cost=3,
        location="53.480800,-2.242600",
    )

    by_text = client.get("/places", params={"text_search": "museum"})
    assert {place["id"] for place in by_text.json()} == {museum["id"]}

    by_cost = client.get("/places", params={"max_cost": 1})
    assert {place["id"] for place in by_cost.json()} == {museum["id"], park["id"]}

    by_tags = client.get("/places", params={"tags": "food,culture"})
    assert {place["id"] for place in by_tags.json()} == {museum["id"], dinner["id"]}

    nearby = client.get(
        "/places",
        params={"distance_from": "51.500700,-0.124600", "radius_km": 5},
    )
    assert {place["id"] for place in nearby.json()} == {museum["id"], park["id"]}


def test_list_places_rejects_invalid_distance_filter(client: TestClient) -> None:
    response = client.get("/places", params={"distance_from": "not-a-location"})

    assert response.status_code == 400
    assert response.json()["detail"] == "distance_from must be 'lat,lon'"


def test_tags_endpoint_returns_distinct_lowercase_tags(client: TestClient) -> None:
    _create_place(client, tags=["Coffee", "Views"])
    _create_place(client, name="Second", tags=["coffee", "Museum"])

    response = client.get("/tags")

    assert response.status_code == 200
    assert response.json() == ["coffee", "museum", "views"]
