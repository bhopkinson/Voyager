# Voyager — Agent Guidelines

## Project overview

Full-stack web app: Next.js 14 frontend · FastAPI backend · PostgreSQL/PostGIS database.

## Development workflow

```bash
cp .env.example .env          # first time: set POSTGRES_PASSWORD, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
make db-init-volume           # once per machine: creates the shared voyager_db_data volume
make dev                      # hot-reload dev server (frontend + backend + db)
make help                     # full list of available targets
```

The frontend hot-reloads on file save. The backend reloads via uvicorn `--reload`. Neither requires a rebuild for code changes.

## Shared database & schema compatibility

**All branches and git worktrees share a single PostgreSQL database** (`voyager_db_data` Docker volume). Schema changes on any branch are immediately live for every other active worktree.

### Rules — follow these for every schema change

1. **Adding a column** — Must be `nullable=True` OR have a `server_default`. Never `NOT NULL` without a default; existing rows on other branches won't supply a value and every INSERT from older code will fail.

2. **Removing a column** — Do NOT use `op.drop_column`. Add a `# DEPRECATED` comment to the ORM model and stop writing to the column. Only drop it in a later migration once all branches have removed reads/writes.

3. **Renaming a column** — Do NOT rename. Add a new column, write a data migration to copy values, then deprecate the old column per rule 2.

4. **Changing a column type** — Only widen (e.g. `VARCHAR(255)` → `TEXT`). Never narrow or change semantics destructively.

5. **Adding a table** — Always safe. Foreign keys to the new table should be `nullable=True` where the referenced row may not yet exist when older-branch code runs.

6. **Dropping a table** — Same process as removing a column: deprecate first, remove all code references across all branches, then drop.

7. **Every schema change requires an Alembic migration** — Never call `Base.metadata.create_all()` or run raw `ALTER TABLE` outside Alembic. Use:

   ```bash
   make db-makemigration MSG="describe your change"
   ```

   Review the generated file in `backend/alembic/versions/` before committing.

8. **Every migration must have a working `downgrade()`** — Write the reverse operation. Verify with:

   ```bash
   make db-rollback
   make db-migrate   # re-apply to confirm round-trip
   ```

### Why this matters

If branch A adds a `NOT NULL` column without a default, and the migration runs on the shared DB, then branch B's backend (which doesn't write that column) will raise an `IntegrityError` on every INSERT until it's updated. Design for the other branch being one step behind.

When in doubt: make the change **additive and nullable**, merge it to all branches first, then tighten constraints in a follow-up migration.

## Worktree port isolation

When running two worktrees simultaneously, set non-overlapping ports in each worktree's `.env`:

```dotenv
# worktree-2/.env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

Both worktrees share the same `voyager_db_data` volume — one dataset, no duplication.
