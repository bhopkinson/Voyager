# Voyager

Voyager is a full-stack web application for tracking places to visit. It includes a FastAPI backend, a Next.js frontend, and a PostgreSQL/PostGIS database.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)
- `make`

### Windows

`make` is not included with Windows. Install it with [Chocolatey](https://chocolatey.org/):

```powershell
choco install make
```

Or with winget:

```powershell
winget install GnuWin32.Make
```

Then reopen your terminal so the new command is on your `PATH`.

Alternatively, run all commands inside **WSL2** for a full Linux environment.

## Project structure

```
/
├── docker-compose.yml        # base compose config (production images)
├── docker-compose.dev.yml    # dev overlay (hot-reload, bind mounts)
├── Makefile                  # all developer commands
├── .env.example              # documented environment variables
├── backend/
│   ├── app/                  # FastAPI application
│   ├── alembic/              # database migrations
│   ├── tests/
│   ├── Dockerfile            # production image
│   └── requirements.txt
└── frontend/
    ├── app/                  # Next.js app router
    ├── components/
    ├── lib/
    ├── Dockerfile            # production image
    ├── Dockerfile.dev        # dev image (next dev)
    └── package.json
```

## First-time setup

These steps are required once per machine.

```bash
# 1. Copy the example env file and fill in your values
cp .env.example .env

# 2. Create the shared database volume
#    All branches and worktrees share this single volume.
make db-init-volume
```

Open `.env` and set at minimum:
- `POSTGRES_PASSWORD` — any password you choose
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — required for place search autocomplete

## Daily development

```bash
make dev        # start all services with hot-reload (foreground)
make dev-d      # same, but in the background
make stop       # stop containers (data is preserved)
make down       # remove containers and networks (data is preserved)
```

- Frontend: `http://localhost:3000` — reloads automatically on file save
- Backend API: `http://localhost:8000` — reloads automatically on file save
- API docs: `http://localhost:8000/docs`

No rebuild is needed for code changes. `--build` is only required when you change `requirements.txt`, `package.json`, or a Dockerfile.

## Logs and shells

```bash
make logs               # tail all services
make logs-backend       # tail backend only
make logs-frontend      # tail frontend only

make shell-backend      # bash inside the backend container
make shell-frontend     # sh inside the frontend container
make db-shell           # psql inside the database container
```

## Running tests

```bash
make test               # runs backend (pytest) and frontend (jest) tests in isolated test containers
make test-backend       # runs backend tests against a separate PostGIS test database
make test-frontend      # runs frontend Jest tests
make test-frontend-typecheck # runs frontend TypeScript checks
make test-e2e           # runs Playwright tests against the isolated test stack
make check              # runs tests and frontend type checking
make test-clean         # removes test containers and test volumes
```

The test database uses its own Docker Compose volume and does not touch the shared
`voyager_db_data` development database.

## Database

### Persistence

Data lives in the Docker volume `voyager_db_data`. It is an external named volume, so it survives `make down` and is shared across all git worktrees. The only way to permanently delete it is:

```bash
docker volume rm voyager_db_data
```

### Backups and restore

```bash
make db-dump                                    # saves to ./backups/dump_<timestamp>.sql
make db-restore FILE=backups/dump_20240101.sql  # restores from a dump file
```

### Schema migrations (Alembic)

The backend runs `alembic upgrade head` automatically on startup, so your schema is always up to date.

When you make a model change:

```bash
# 1. Generate the migration (review the file before committing)
make db-makemigration MSG="add rating column to visits"

# 2. Apply it
make db-migrate

# 3. Verify the downgrade works
make db-rollback
make db-migrate
```

Migration files live in `backend/alembic/versions/`. Every migration must have a working `downgrade()`. See the schema compatibility rules in `CLAUDE.md` before making any changes.

## Working with git worktrees

Each worktree gets its own isolated set of containers (the `COMPOSE_PROJECT_NAME` is derived automatically from the git branch name). All worktrees share the same `voyager_db_data` volume.

To run two worktrees simultaneously without port conflicts, set different ports in each worktree's `.env`:

```dotenv
# worktree-2/.env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

## Production build

```bash
make build      # build and start production images (foreground)
make build-d    # same, in the background
```

## All available commands

```
make help
```

## Environment variables

See `.env.example` for the full list with descriptions. Key variables:

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_PASSWORD` | `postgres` | Database password |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | _(empty)_ | Google Maps API key |
| `FRONTEND_PORT` | `3000` | Host port for the frontend |
| `BACKEND_PORT` | `8000` | Host port for the backend |
| `COMPOSE_PROJECT_NAME` | _(git branch)_ | Override container/network naming |
