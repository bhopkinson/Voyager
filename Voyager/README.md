# Voyager

Voyager is a full-stack web application for tracking places to visit. It includes a FastAPI backend, a Next.js frontend, and a PostgreSQL database with PostGIS for geospatial queries.

## Monorepo Structure

```
/voyager
├── .devcontainer/
│   └── devcontainer.json
├── .gitignore
├── docker-compose.yml
├── README.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── crud.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── app/
    ├── components/
    ├── public/
    ├── .eslintrc.json
    ├── Dockerfile
    ├── jest.config.js
    ├── next.config.js
    ├── package.json
    ├── tsconfig.json
    ├── postcss.config.js
    └── tailwind.config.ts
```

## Quick Start (Docker)

1. Create a `.env` file at the project root (optional; defaults are provided):

```
POSTGRES_DB=voyager
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5432
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

2. Start the stack:

```
docker compose up --build
```

- Backend API: `http://localhost:8000` (docs at `/docs`)
- Frontend App: `http://localhost:3000`
- Postgres (PostGIS): `localhost:5432`

## Development (Dev Container)

This repository includes a VS Code Dev Container. Open the folder in VS Code and “Reopen in Container.” The container uses `docker-compose.yml` and installs Python and Node dependencies on create.

## Environment Variables

- Backend: `DATABASE_URL` (defaults to `postgresql+psycopg2://postgres:postgres@db:5432/voyager`)
- Frontend: `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`)

## Testing

- Backend: `pytest`
- Frontend: `npm test --prefix frontend`

## Notes

- Geocoding uses `geopy` with Nominatim. If `location` is in "lat,lon" format, it is parsed directly; otherwise, Nominatim is used.
- Geospatial filtering uses PostGIS via `GeoAlchemy2` and `ST_DWithin` with geography to compute distances in meters.
