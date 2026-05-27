from __future__ import annotations

import os
from pathlib import Path
from typing import Iterator

import pytest
from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from fastapi.testclient import TestClient
from sqlalchemy import text

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@db-test:5432/voyager_test",
)
os.environ.setdefault("VOYAGER_SKIP_STARTUP_MIGRATIONS", "1")

from app.main import SessionLocal, app, engine, get_db  # noqa: E402


BACKEND_ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def migrated_db() -> Iterator[None]:
    cfg = AlembicConfig(str(BACKEND_ROOT / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])
    alembic_command.upgrade(cfg, "head")
    yield


def _truncate_database() -> None:
    with engine.begin() as connection:
        connection.execute(text("TRUNCATE TABLE visits, places RESTART IDENTITY CASCADE"))


@pytest.fixture()
def db_session(migrated_db: None) -> Iterator:
    _truncate_database()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        _truncate_database()


@pytest.fixture()
def client(migrated_db: None) -> Iterator[TestClient]:
    _truncate_database()
    db = SessionLocal()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        db.close()
        _truncate_database()
