# Database Migrations

OpenBioDesign uses Alembic for production schema changes.

Run migrations:

```powershell
cd platform/backend
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Generate a new migration after SQLAlchemy model changes:

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "describe change"
```

The development app still initializes missing tables through SQLAlchemy metadata to keep local onboarding simple. Production deployments should run Alembic migrations explicitly before starting API or worker services.
