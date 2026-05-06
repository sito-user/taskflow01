# PLAN.md — TaskFlow Tasks Slice Implementation

## 1. Database

### 1.1 Entities & Columns

1. **`organizations`** (pre-existing, listed for FK reference)
   - `id` UUID v4, PK
   - `name` VARCHAR(255) NOT NULL
   - `created_at`, `updated_at`, `deleted_at` TIMESTAMP

2. **`users`** (pre-existing, listed for FK reference)
   - `id` UUID v4, PK
   - `organization_id` UUID NOT NULL, FK → `organizations.id`
   - `email` VARCHAR(255) NOT NULL
   - `role` ENUM(`admin`, `member`) NOT NULL
   - `created_at`, `updated_at`, `deleted_at` TIMESTAMP

3. **`projects`** (pre-existing, listed for FK reference)
   - `id` UUID v4, PK
   - `organization_id` UUID NOT NULL, FK → `organizations.id`
   - `name` VARCHAR(255) NOT NULL
   - `created_at`, `updated_at`, `deleted_at` TIMESTAMP

4. **`tasks`** (new table)
   - `id` UUID v4, PK
   - `organization_id` UUID NOT NULL, FK → `organizations.id`
   - `project_id` UUID NOT NULL, FK → `projects.id`
   - `title` VARCHAR(255) NOT NULL
   - `description` TEXT NULL
   - `status` ENUM(`todo`, `in_progress`, `done`) NOT NULL, DEFAULT `todo`
   - `priority` ENUM(`low`, `medium`, `high`) NOT NULL, DEFAULT `medium`
   - `assigned_to` UUID NULL, FK → `users.id`
   - `created_by` UUID NOT NULL, FK → `users.id`
   - `due_date` DATE NULL
   - `created_at` TIMESTAMP NOT NULL
   - `updated_at` TIMESTAMP NOT NULL
   - `deleted_at` TIMESTAMP NULL

### 1.2 Foreign Keys & Indexes

5. `tasks.organization_id` → FK + single-column index
6. `tasks.project_id` → FK + single-column index
7. `tasks.assigned_to` → FK + single-column index
8. `tasks.created_by` → FK + single-column index
9. Composite index `(organization_id, project_id)` on `tasks` — most-selective column (`organization_id`) first; matches the primary list query

---

## 2. Migrations & Seed Data

10. Create migration file `YYYYMMDDHHMMSS_create_tasks_table.js`
    - Defines all columns, types, defaults, and NOT NULL constraints listed above
    - Defines all four FK constraints
    - Defines all five indexes (four single-column + one composite)
    - Never modifies any existing migration file

11. Create seed file `seeds/01_tasks_seed.js`
    - Depends on existing org, user, and project seed data
    - Inserts a minimum of:
      - 2 tasks in Org A / Project A (various statuses and priorities)
      - 1 task in Org B / Project B (to verify tenant isolation in tests)
      - 1 task with `assigned_to` set and 1 with it null
      - 1 task with `due_date` set and 1 without
    - All IDs are deterministic UUIDs (not random) so tests can reference them by value

---

## 3. API Endpoints

12. **POST `/projects/:projectId/tasks`** — Create a task
    - Auth: required (JWT → `req.user`)
    - Request body: `{ title, description?, status?, priority?, assigned_to?, due_date? }`
    - `organization_id` set from `req.user.organization_id` (never from body)
    - `created_by` set from `req.user.id`
    - Validation: project must exist AND belong to caller's org → 404 if not
    - Validation: `assigned_to` (if provided) must be a user in the same org → 422 if not
    - Validation: `title` required, max 255 chars → 422 if missing/over-length
    - Response 201: full task object

13. **GET `/projects/:projectId/tasks`** — List tasks for a project
    - Auth: required
    - Query: no additional filters in v1
    - Validation: project must exist AND belong to caller's org → 404 if not
    - Excludes rows where `deleted_at IS NOT NULL`
    - Response 200: array of task objects (empty array if none)

14. **GET `/projects/:projectId/tasks/:taskId`** — View a single task
    - Auth: required
    - Validation: project must exist AND belong to caller's org → 404 if not
    - Validation: task must exist, belong to the same project and org, and not be soft-deleted → 404 if not
    - Response 200: full task object

15. **PATCH `/projects/:projectId/tasks/:taskId`** — Update a task
    - Auth: required
    - Request body: any subset of `{ title, description, status, priority, assigned_to, due_date }`
    - Validation: same existence + org-scoping checks as GET single → 404 if not
    - Immutable fields: `organization_id`, `project_id`, `created_by` — ignored if present in body
    - `assigned_to` change: validate new user belongs to same org → 422 if not
    - Response 200: updated full task object

16. **DELETE `/projects/:projectId/tasks/:taskId`** — Soft-delete a task
    - Auth: required
    - Validation: same existence + org-scoping checks as GET single → 404 if not
    - Sets `deleted_at = NOW()`; no row is ever dropped
    - Response 204: no content

---

## 4. Tests to Write First (Red Phase)

> All tests run against `taskflow_test`. All test files live in
> `src/features/tasks/tests/`. Tests are written before any handler code.

### POST `/projects/:projectId/tasks`

17. Returns 201 and the created task object when all required fields are valid
18. Returns 404 when `projectId` does not exist
19. Returns 404 when `projectId` belongs to a different organization
20. Returns 422 when `title` is missing
21. Returns 422 when `title` exceeds 255 characters
22. Returns 422 when `assigned_to` is a user from a different organization
23. Sets `organization_id` from auth context, not from request body
24. Sets `created_by` from auth context, not from request body
25. Defaults `status` to `todo` when omitted
26. Defaults `priority` to `medium` when omitted

### GET `/projects/:projectId/tasks`

27. Returns 200 and an array of tasks for a valid project in caller's org
28. Returns an empty array when the project has no tasks
29. Does not include soft-deleted tasks in the response
30. Returns 404 when `projectId` does not exist
31. Returns 404 when `projectId` belongs to a different organization
32. Does not return tasks from any other organization

### GET `/projects/:projectId/tasks/:taskId`

33. Returns 200 and the full task object for a valid task
34. Returns 404 when `taskId` does not exist
35. Returns 404 when the task belongs to a different organization
36. Returns 404 when the task has been soft-deleted
37. Returns 404 when the task exists but belongs to a different project

### PATCH `/projects/:projectId/tasks/:taskId`

38. Returns 200 and the updated task when a valid partial update is submitted
39. Successfully transitions status from `todo` → `done` (free movement)
40. Successfully transitions status from `done` → `todo` (reverse movement)
41. Does not allow `organization_id` to be changed via the request body
42. Does not allow `project_id` to be changed via the request body
43. Does not allow `created_by` to be changed via the request body
44. Returns 422 when `assigned_to` is updated to a user from a different org
45. Returns 404 when `taskId` does not exist or is soft-deleted
46. Returns 404 when `projectId` belongs to a different organization

### DELETE `/projects/:projectId/tasks/:taskId`

47. Returns 204 and sets `deleted_at` on the task row
48. Task no longer appears in list or view endpoints after soft-delete
49. Returns 404 when `taskId` does not exist
50. Returns 404 when the task belongs to a different organization
51. Returns 404 when the task is already soft-deleted

---

## 5. Frontend Components

> All components live in `src/features/tasks/`. All API calls go through
> `src/api/tasks.ts`. Every component renders loading, success, and error states.

52. **`src/api/tasks.ts`** — API layer (not a component)
    - Exports: `createTask`, `listTasks`, `getTask`, `updateTask`, `deleteTask`
    - All functions call `fetch` (or the app's HTTP client); no `fetch()` in any component
    - Typed request and response shapes; no `any`

53. **`TaskList`** (`src/features/tasks/TaskList.tsx`)
    - Purpose: displays all non-deleted tasks for a given `projectId`
    - Consumes: `GET /projects/:projectId/tasks`
    - Renders: loading spinner, error message, or list of `TaskCard` sub-components
    - Entry point for navigating to `TaskDetail` and opening `TaskCreateForm`

54. **`TaskCard`** (`src/features/tasks/TaskCard.tsx`)
    - Purpose: compact summary row/card inside `TaskList`
    - Displays: title, status badge, priority badge, assignee name (or "Unassigned")
    - No direct API calls; receives task data as props from `TaskList`

55. **`TaskDetail`** (`src/features/tasks/TaskDetail.tsx`)
    - Purpose: full view of a single task
    - Consumes: `GET /projects/:projectId/tasks/:taskId`
    - Renders: all task fields, loading state, error state, and a delete button
    - Hosts inline status/priority update controls (delegates to `updateTask`)
    - Delete action calls `deleteTask` then redirects to `TaskList`

56. **`TaskCreateForm`** (`src/features/tasks/TaskCreateForm.tsx`)
    - Purpose: form to create a new task
    - Consumes: `POST /projects/:projectId/tasks`
    - Fields: title (required), description, status, priority, assigned_to (user picker), due_date
    - Renders: loading state on submit, inline field errors on 422, success redirect to `TaskDetail`
    - Every interactive field has a visible label or `aria-label`

cat > docs/PLAN.md << 'EOF'
# PLAN.md — TaskFlow Tasks Slice Implementation

## 1. Database

### 1.1 Entities & Columns

1. **`organizations`** (pre-existing, listed for FK reference)
   - `id` UUID v4, PK
   - `name` VARCHAR(255) NOT NULL
   - `created_at`, `updated_at`, `deleted_at` TIMESTAMP

2. **`users`** (pre-existing, listed for FK reference)
   - `id` UUID v4, PK
   - `organization_id` UUID NOT NULL, FK → `organizations.id`
   - `email` VARCHAR(255) NOT NULL
   - `role` ENUM(`admin`, `member`) NOT NULL
   - `created_at`, `updated_at`, `deleted_at` TIMESTAMP

3. **`projects`** (pre-existing, listed for FK reference)
   - `id` UUID v4, PK
   - `organization_id` UUID NOT NULL, FK → `organizations.id`
   - `name` VARCHAR(255) NOT NULL
   - `created_at`, `updated_at`, `deleted_at` TIMESTAMP

4. **`tasks`** (new table)
   - `id` UUID v4, PK
   - `organization_id` UUID NOT NULL, FK → `organizations.id`
   - `project_id` UUID NOT NULL, FK → `projects.id`
   - `title` VARCHAR(255) NOT NULL
   - `description` TEXT NULL
   - `status` ENUM(`todo`, `in_progress`, `done`) NOT NULL, DEFAULT `todo`
   - `priority` ENUM(`low`, `medium`, `high`) NOT NULL, DEFAULT `medium`
   - `assigned_to` UUID NULL, FK → `users.id`
   - `created_by` UUID NOT NULL, FK → `users.id`
   - `due_date` DATE NULL
   - `created_at` TIMESTAMP NOT NULL
   - `updated_at` TIMESTAMP NOT NULL
   - `deleted_at` TIMESTAMP NULL

### 1.2 Foreign Keys & Indexes

5. `tasks.organization_id` → FK + single-column index
6. `tasks.project_id` → FK + single-column index
7. `tasks.assigned_to` → FK + single-column index
8. `tasks.created_by` → FK + single-column index
9. Composite index `(organization_id, project_id)` on `tasks` — most-selective column (`organization_id`) first; matches the primary list query

---

## 2. Migrations & Seed Data

10. Create migration file `YYYYMMDDHHMMSS_create_tasks_table.js`
    - Defines all columns, types, defaults, and NOT NULL constraints listed above
    - Defines all four FK constraints
    - Defines all five indexes (four single-column + one composite)
    - Never modifies any existing migration file

11. Create seed file `seeds/01_tasks_seed.js`
    - Depends on existing org, user, and project seed data
    - Inserts a minimum of:
      - 2 tasks in Org A / Project A (various statuses and priorities)
      - 1 task in Org B / Project B (to verify tenant isolation in tests)
      - 1 task with `assigned_to` set and 1 with it null
      - 1 task with `due_date` set and 1 without
    - All IDs are deterministic UUIDs (not random) so tests can reference them by value

---

## 3. API Endpoints

12. **POST `/projects/:projectId/tasks`** — Create a task
    - Auth: required (JWT → `req.user`)
    - Request body: `{ title, description?, status?, priority?, assigned_to?, due_date? }`
    - `organization_id` set from `req.user.organization_id` (never from body)
    - `created_by` set from `req.user.id`
    - Validation: project must exist AND belong to caller's org → 404 if not
    - Validation: `assigned_to` (if provided) must be a user in the same org → 422 if not
    - Validation: `title` required, max 255 chars → 422 if missing/over-length
    - Response 201: full task object

13. **GET `/projects/:projectId/tasks`** — List tasks for a project
    - Auth: required
    - Query: no additional filters in v1
    - Validation: project must exist AND belong to caller's org → 404 if not
    - Excludes rows where `deleted_at IS NOT NULL`
    - Response 200: array of task objects (empty array if none)

14. **GET `/projects/:projectId/tasks/:taskId`** — View a single task
    - Auth: required
    - Validation: project must exist AND belong to caller's org → 404 if not
    - Validation: task must exist, belong to the same project and org, and not be soft-deleted → 404 if not
    - Response 200: full task object

15. **PATCH `/projects/:projectId/tasks/:taskId`** — Update a task
    - Auth: required
    - Request body: any subset of `{ title, description, status, priority, assigned_to, due_date }`
    - Validation: same existence + org-scoping checks as GET single → 404 if not
    - Immutable fields: `organization_id`, `project_id`, `created_by` — ignored if present in body
    - `assigned_to` change: validate new user belongs to same org → 422 if not
    - Response 200: updated full task object

16. **DELETE `/projects/:projectId/tasks/:taskId`** — Soft-delete a task
    - Auth: required
    - Validation: same existence + org-scoping checks as GET single → 404 if not
    - Sets `deleted_at = NOW()`; no row is ever dropped
    - Response 204: no content

---

## 4. Tests to Write First (Red Phase)

> All tests run against `taskflow_test`. All test files live in
> `src/features/tasks/tests/`. Tests are written before any handler code.

### POST `/projects/:projectId/tasks`

17. Returns 201 and the created task object when all required fields are valid
18. Returns 404 when `projectId` does not exist
19. Returns 404 when `projectId` belongs to a different organization
20. Returns 422 when `title` is missing
21. Returns 422 when `title` exceeds 255 characters
22. Returns 422 when `assigned_to` is a user from a different organization
23. Sets `organization_id` from auth context, not from request body
24. Sets `created_by` from auth context, not from request body
25. Defaults `status` to `todo` when omitted
26. Defaults `priority` to `medium` when omitted

### GET `/projects/:projectId/tasks`

27. Returns 200 and an array of tasks for a valid project in caller's org
28. Returns an empty array when the project has no tasks
29. Does not include soft-deleted tasks in the response
30. Returns 404 when `projectId` does not exist
31. Returns 404 when `projectId` belongs to a different organization
32. Does not return tasks from any other organization

### GET `/projects/:projectId/tasks/:taskId`

33. Returns 200 and the full task object for a valid task
34. Returns 404 when `taskId` does not exist
35. Returns 404 when the task belongs to a different organization
36. Returns 404 when the task has been soft-deleted
37. Returns 404 when the task exists but belongs to a different project

### PATCH `/projects/:projectId/tasks/:taskId`

38. Returns 200 and the updated task when a valid partial update is submitted
39. Successfully transitions status from `todo` → `done` (free movement)
40. Successfully transitions status from `done` → `todo` (reverse movement)
41. Does not allow `organization_id` to be changed via the request body
42. Does not allow `project_id` to be changed via the request body
43. Does not allow `created_by` to be changed via the request body
44. Returns 422 when `assigned_to` is updated to a user from a different org
45. Returns 404 when `taskId` does not exist or is soft-deleted
46. Returns 404 when `projectId` belongs to a different organization

### DELETE `/projects/:projectId/tasks/:taskId`

47. Returns 204 and sets `deleted_at` on the task row
48. Task no longer appears in list or view endpoints after soft-delete
49. Returns 404 when `taskId` does not exist
50. Returns 404 when the task belongs to a different organization
51. Returns 404 when the task is already soft-deleted

---

## 5. Frontend Components

> All components live in `src/features/tasks/`. All API calls go through
> `src/api/tasks.ts`. Every component renders loading, success, and error states.

52. **`src/api/tasks.ts`** — API layer (not a component)
    - Exports: `createTask`, `listTasks`, `getTask`, `updateTask`, `deleteTask`
    - All functions call `fetch` (or the app's HTTP client); no `fetch()` in any component
    - Typed request and response shapes; no `any`

53. **`TaskList`** (`src/features/tasks/TaskList.tsx`)
    - Purpose: displays all non-deleted tasks for a given `projectId`
    - Consumes: `GET /projects/:projectId/tasks`
    - Renders: loading spinner, error message, or list of `TaskCard` sub-components
    - Entry point for navigating to `TaskDetail` and opening `TaskCreateForm`

54. **`TaskCard`** (`src/features/tasks/TaskCard.tsx`)
    - Purpose: compact summary row/card inside `TaskList`
    - Displays: title, status badge, priority badge, assignee name (or "Unassigned")
    - No direct API calls; receives task data as props from `TaskList`

55. **`TaskDetail`** (`src/features/tasks/TaskDetail.tsx`)
    - Purpose: full view of a single task
    - Consumes: `GET /projects/:projectId/tasks/:taskId`
    - Renders: all task fields, loading state, error state, and a delete button
    - Hosts inline status/priority update controls (delegates to `updateTask`)
    - Delete action calls `deleteTask` then redirects to `TaskList`

56. **`TaskCreateForm`** (`src/features/tasks/TaskCreateForm.tsx`)
    - Purpose: form to create a new task
    - Consumes: `POST /projects/:projectId/tasks`
    - Fields: title (required), description, status, priority, assigned_to (user picker), due_date
    - Renders: loading state on submit, inline field errors on 422, success redirect to `TaskDetail`
    - Every interactive field has a visible label or `aria-label`

57. **`TaskEditForm`** (`src/features/tasks/TaskEditForm.tsx`)
    - Purpose: form to edit an existing task's fields
    - Consumes: `PATCH /projects/:projectId/tasks/:taskId`
    - Pre-populated with current task values
    - Same field set and validation feedback pattern as `TaskCreateForm`
    - Every interactive field has a visible label or `aria-label`

---

## 6. Implementation Order

> Smallest, most self-contained slices first. Tests written before handler code at each step.

58. **Slice 1 — Migration & seed**
    - Write and run `create_tasks_table` migration
    - Write and run `tasks` seed file
    - Verify schema in `taskflow_test` DB

59. **Slice 2 — Repository layer**
    - `task-repository.ts`: `insert`, `findById`, `findByProject`, `softDelete`, `update`
    - All queries use explicit column lists (no `SELECT *`)
    - All queries filter by `organization_id`
    - All read queries exclude `deleted_at IS NOT NULL`

60. **Slice 3 — Service layer**
    - `task-service.ts`: wraps repository; owns org-scoping checks, project validation, assignee validation
    - Unit tests for validation logic in isolation (mock repository)

61. **Slice 4 — Create endpoint (POST)**
    - Write failing tests (items 17–26) first
    - Implement route → controller → service → repository
    - Tests pass; coverage threshold met for new files

62. **Slice 5 — List endpoint (GET collection)**
    - Write failing tests (items 27–32) first
    - Implement handler; reuses service/repository from Slice 4
    - Tests pass

63. **Slice 6 — View endpoint (GET single)**
    - Write failing tests (items 33–37) first
    - Implement handler

