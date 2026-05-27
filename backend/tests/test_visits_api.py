from __future__ import annotations

from fastapi.testclient import TestClient


def _create_place(client: TestClient) -> dict:
    response = client.post(
        "/places",
        json={
            "name": "Visit Place",
            "location": "51.507400,-0.127800",
            "tags": ["visits"],
            "cost": 1,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_update_and_delete_visit(client: TestClient) -> None:
    place = _create_place(client)

    created = client.post(
        f"/places/{place['id']}/visits",
        json={"visit_date": "2026-05-27", "rating": 5, "notes": "Great"},
    )
    assert created.status_code == 201
    visit = created.json()
    assert visit["rating"] == 5

    fetched_place = client.get(f"/places/{place['id']}")
    assert fetched_place.status_code == 200
    assert fetched_place.json()["visits"][0]["id"] == visit["id"]

    updated = client.put(
        f"/visits/{visit['id']}",
        json={"visit_date": "2026-05-28", "rating": 4, "notes": "Still good"},
    )
    assert updated.status_code == 200
    assert updated.json()["visit_date"] == "2026-05-28"
    assert updated.json()["rating"] == 4

    deleted = client.delete(f"/visits/{visit['id']}")
    assert deleted.status_code == 204

    missing = client.put(f"/visits/{visit['id']}", json={"notes": "Nope"})
    assert missing.status_code == 404


def test_create_visit_for_missing_place_returns_404(client: TestClient) -> None:
    response = client.post(
        "/places/999/visits",
        json={"visit_date": "2026-05-27", "rating": 5},
    )

    assert response.status_code == 404
