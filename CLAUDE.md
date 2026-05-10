# CLAUDE.md — TaskFlow

## Project Overview
TaskFlow is a multi-tenant task management SaaS for teams of 5–50 people: each
organization manages projects and tasks in an isolated workspace, with users
assigned to tasks, status workflow (todo / in_progress / done), and priority
levels (low / medium / high).

## Architecture & Boundaries
1. Backend layered: routes → middleware → controller → service → repository → db. No skipping layers.
2. Frontend: components consume the api/ layer only. No backend types leaked into UI.
3. Each feature lives in its own folder: src/features/<feature-name>/.

## Coding Conventions
1. Filenames: PascalCase for React components, kebab-case for everything else.
2. No any types in TypeScript. If a type is unknown, use unknown and narrow.
3. Lines under 100 characters where reasonable. Prettier on save.

## Database Rules
1. Primary keys: UUID v4. Never auto-increment integers.
2. Audit columns on every table: created_at, updated_at, deleted_at (TIMESTAMP NULL).
3. Soft delete only: never DROP rows. Set deleted_at instead.
4. Multi-tenancy: every tenant-scoped table carries an organization_id FK.
5. Every foreign key column has a corresponding index — explicitly, never assumed.
6. Composite indexes match real query patterns. Most-selective column first.
7. Schema changes are new Knex migration files. Never modify an existing migration.

## Testing Rules
1. Test-first for every new endpoint: write the failing test (Red) before any handler code.
2. Tests run against a separate test database (taskflow_test). Never the dev database.
3. Coverage threshold for new files in this checkpoint: 80% lines, 70% branches.
4. E2E tests cover critical user journeys: signup, login, create task, view task.
5. E2E tests run against a fresh test database, isolated from dev and unit-test DB.
6. Each E2E test is independent: no shared state between tests, reset fixtures in beforeEach.

## Frontend Rules
1. One component per file. Default export. PascalCase filename.
2. Component size limit: 150 lines. Over the limit splits into sub-components.
3. API calls go through src/api/ only. No fetch() inside a component.
4. Every API call renders three states: loading, success, error. No silent failures.
5. Every interactive element has a visible label or an aria-label.
6. State management library: React useState + useReducer for local state. No global state library for this slice.

## Forbidden Patterns
1. Never call fetch() directly in a React component.
2. Never use a SELECT * in production query code (use explicit column lists).
3. Never store JWT tokens in localStorage.

## Always-On Behaviors
1. Read CLAUDE.md at the start of every conversation before generating any code.
2. When asked to plan, always output a numbered checklist before generating code.

## Security Rules
1. Authentication: JWT in httpOnly + Secure + SameSite=Lax cookies. Never localStorage.
2. Password hashing: bcrypt with cost factor 12. Never MD5, SHA256, or plain.
3. Rate limit on auth endpoints: 5 attempts per 15 minutes per IP.
4. Validate ALL user input with Joi at the route boundary. Never trust req.body.
5. Security headers via Helmet: CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
6. CORS: explicit allow-list of origins. No wildcard in production.
7. Secrets via environment variables only. Never commit .env. Never hardcode.

## Deployment Rules
1. Multi-stage Dockerfiles: separate build stage from runtime stage. Final image uses a slim base (alpine).
2. Run as non-root user inside containers (USER node).
3. Healthcheck endpoint at GET /healthz returning 200 + JSON status.
4. Render.com is the production platform.
5. No secrets in Dockerfile. All via environment variables.
