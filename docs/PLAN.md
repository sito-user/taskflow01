# PLAN.md — TaskFlow Tasks Slice Implementation

## 1. Database

### 1.1 Entities & Columns

1. organizations: id UUID v4 PK, name VARCHAR(255) NOT NULL, created_at, updated_at, deleted_at
2. users: id UUID v4 PK, organization_id FK, email VARCHAR(255) NOT NULL, role ENUM(admin|member), audit columns
3. projects: id UUID v4 PK, organization_id FK, name VARCHAR(255) NOT NULL, audit columns
4. tasks: id UUID v4 PK, organization_id FK, project_id FK, title VARCHAR(255) NOT NULL, description TEXT NULL, status ENUM(todo|in_progress|done) DEFAULT todo, priority ENUM(low|medium|high) DEFAULT medium, assigned_to FK NULL, created_by FK NOT NULL, due_date DATE NULL, audit columns

### 1.2 Foreign Keys & Indexes

5. tasks.organization_id FK + single-column index
6. tasks.project_id FK + single-column index
7. tasks.assigned_to FK + single-column index
8. tasks.created_by FK + single-column index
9. Composite index (project_id, organization_id) on tasks — project_id first as more selective

---

## 2. Migrations & Seed Data

10. Migration 001_organizations_users.js — organizations + users tables
11. Migration 002_projects.js — projects table
12. Migration 003_tasks.js — tasks table with all indexes
13. Seed 001_base_data.js — 2 orgs, 5 users, 4 projects, 20 tasks with hardcoded deterministic UUIDs

---

## 3. API Endpoints

14. POST /api/tasks — create task, auth required, 201
    - organization_id from req.user.organization_id (never from body)
    - created_by from req.user.id
    - project must exist AND belong to caller org → 404 if not
    - title required max 255 chars → 422 if missing
    - assigned_to must be user in same org → 422 if not

15. GET /api/tasks?project_id=X — list tasks, auth required, 200
    - excludes deleted_at IS NOT NULL
    - project must belong to caller org → 404 if not

16. GET /api/tasks/:id — view task, auth required, 200 or 404
    - task.organization_id !== user.organization_id → 404 (not 403)

17. PATCH /api/tasks/:id — update task, auth required, 200
    - organization_id, project_id, created_by are immutable
    - assigned_to change validated against same org

18. DELETE /api/tasks/:id — soft delete, auth required, 204
    - sets deleted_at = NOW(), never drops row

---

## 4. Tests to Write First (Red Phase)

All tests run against taskflow_test. Tests written before any handler code.

### POST /api/tasks
19. Returns 201 and created task when payload is valid
20. Returns 401 when no auth header
21. Returns 422 when title is missing
22. Returns 422 when title exceeds 255 chars
23. Returns 404 when project_id belongs to different org
24. Sets organization_id from auth context, not from body
25. Sets created_by from auth context, not from body
26. Defaults status to todo when omitted
27. Defaults priority to medium when omitted

### GET /api/tasks/:id
28. Returns 200 and full task for valid request
29. Returns 401 when no auth header
30. Returns 404 when task does not exist
31. Returns 404 when task belongs to different org (cross-tenant isolation)
32. Returns 404 when task is soft-deleted

### GET /api/tasks?project_id=X
33. Returns 200 and array of tasks for valid project
34. Returns empty array when project has no tasks
35. Does not include soft-deleted tasks
36. Returns 404 when project belongs to different org

### PATCH /api/tasks/:id
37. Returns 200 and updated task for valid partial update
38. Does not allow organization_id to be changed
39. Returns 404 when task belongs to different org
40. Returns 422 when assigned_to is user from different org

### DELETE /api/tasks/:id
41. Returns 204 and sets deleted_at on the row
42. Task no longer appears in list after soft-delete
43. Returns 404 when task belongs to different org

---

## 5. Frontend Components

All API calls go through src/api/tasks.ts (TypeScript, no any, typed shapes).
cat > docs/PLAN.md << 'EOF'
# PLAN.md — TaskFlow Tasks Slice Implementation

## 1. Database

### 1.1 Entities & Columns

1. organizations: id UUID v4 PK, name VARCHAR(255) NOT NULL, created_at, updated_at, deleted_at
2. users: id UUID v4 PK, organization_id FK, email VARCHAR(255) NOT NULL, role ENUM(admin|member), audit columns
3. projects: id UUID v4 PK, organization_id FK, name VARCHAR(255) NOT NULL, audit columns
4. tasks: id UUID v4 PK, organization_id FK, project_id FK, title VARCHAR(255) NOT NULL, description TEXT NULL, status ENUM(todo|in_progress|done) DEFAULT todo, priority ENUM(low|medium|high) DEFAULT medium, assigned_to FK NULL, created_by FK NOT NULL, due_date DATE NULL, audit columns

### 1.2 Foreign Keys & Indexes

5. tasks.organization_id FK + single-column index
6. tasks.project_id FK + single-column index
7. tasks.assigned_to FK + single-column index
8. tasks.created_by FK + single-column index
9. Composite index (project_id, organization_id) on tasks — project_id first as more selective

---

## 2. Migrations & Seed Data

10. Migration 001_organizations_users.js — organizations + users tables
11. Migration 002_projects.js — projects table
12. Migration 003_tasks.js — tasks table with all indexes
13. Seed 001_base_data.js — 2 orgs, 5 users, 4 projects, 20 tasks with hardcoded deterministic UUIDs

---

## 3. API Endpoints

14. POST /api/tasks — create task, auth required, 201
    - organization_id from req.user.organization_id (never from body)
    - created_by from req.user.id
    - project must exist AND belong to caller org → 404 if not
    - title required max 255 chars → 422 if missing
    - assigned_to must be user in same org → 422 if not

15. GET /api/tasks?project_id=X — list tasks, auth required, 200
    - excludes deleted_at IS NOT NULL
    - project must belong to caller org → 404 if not

16. GET /api/tasks/:id — view task, auth required, 200 or 404
    - task.organization_id !== user.organization_id → 404 (not 403)

17. PATCH /api/tasks/:id — update task, auth required, 200
    - organization_id, project_id, created_by are immutable
    - assigned_to change validated against same org

18. DELETE /api/tasks/:id — soft delete, auth required, 204
    - sets deleted_at = NOW(), never drops row

---

## 4. Tests to Write First (Red Phase)

All tests run against taskflow_test. Tests written before any handler code.

### POST /api/tasks
19. Returns 201 and created task when payload is valid
20. Returns 401 when no auth header
21. Returns 422 when title is missing
22. Returns 422 when title exceeds 255 chars
23. Returns 404 when project_id belongs to different org
24. Sets organization_id from auth context, not from body
25. Sets created_by from auth context, not from body
26. Defaults status to todo when omitted
27. Defaults priority to medium when omitted

### GET /api/tasks/:id
28. Returns 200 and full task for valid request
29. Returns 401 when no auth header
30. Returns 404 when task does not exist
31. Returns 404 when task belongs to different org (cross-tenant isolation)
32. Returns 404 when task is soft-deleted

### GET /api/tasks?project_id=X
33. Returns 200 and array of tasks for valid project
34. Returns empty array when project has no tasks
35. Does not include soft-deleted tasks
36. Returns 404 when project belongs to different org

### PATCH /api/tasks/:id
37. Returns 200 and updated task for valid partial update
38. Does not allow organization_id to be changed
39. Returns 404 when task belongs to different org
40. Returns 422 when assigned_to is user from different org


