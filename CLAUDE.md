# CLAUDE.md — TaskFlow

## Project Overview
TaskFlow is a multi-tenant task management SaaS for teams of 5–50 people: each
organization manages projects and tasks in an isolated workspace, with users
assigned to tasks, status workflow (todo / in_progress / done), and priority
levels (low / medium / high).

## Architecture & Boundaries

## Coding Conventions

## Database Rules
1. Primary keys: UUID v4. Never auto-increment integers.
2. Audit columns on every table: created_at, updated_at, deleted_at (TIMESTAMP NULL).
3. Soft delete only: never DROP rows. Set deleted_at instead.
4. Multi-tenancy: every tenant-scoped table carries an organization_id FK.
5. Every foreign key column has a corresponding index — explicitly, never assumed.
6. (Bonus) Composite indexes match real query patterns. Most-selective column first.
7. Schema changes are new Knex migration files. Never modify an existing migration.

## Testing Rules

## Frontend Rules

## Forbidden Patterns

## Always-On Behaviors
