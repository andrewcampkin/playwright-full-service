# Database Migrations

This folder contains Entity Framework Core migrations for the PlaywrightService database.

## Creating Migrations

To create a new migration:
```bash
docker-compose exec backend dotnet ef migrations add <MigrationName>
```

## Applying Migrations

To apply migrations to the database:
```bash
docker-compose exec backend dotnet ef database update
```

## Rolling Back Migrations

To rollback to a specific migration:
```bash
docker-compose exec backend dotnet ef database update <PreviousMigrationName>
```

## Migration Files

- `InitialCreate` - Initial database schema with all core entities
