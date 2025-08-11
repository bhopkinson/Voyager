from fastapi.testclient import TestClient

from app.main import app


def test_root_healthy():
    client = TestClient(app)
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["message"] == "Voyager API"
