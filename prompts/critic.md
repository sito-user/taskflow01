# Critic Agent Findings — Checkpoint 1

1. Seed UUIDs must be hardcoded string literals, not generated at runtime.
2. api/tasks.js uses fetch internally — components must never call fetch directly.
3. No frontend component tests planned — coverage threshold will fail.
4. Migration filename placeholder will cause ordering conflicts between developers.
5. Repository built before its tests — violates test-first rule.
6. Seed not explicitly verified against taskflow_test before repository layer.
7. No authentication middleware step in the plan — biggest blocker.
8. No projects repository lookup function referenced for project validation.
9. No user lookup function referenced for assignee validation.
10. No step to create taskflow_test database and run migrations against it.
11. TaskList depends on TaskCard — dependency direction not acknowledged.
12. PATCH inline controls in TaskDetail have no test coverage planned.
13. Inline status controls in TaskDetail are undeclared scope addition.
14. No error response body shape defined — risk of silent failures in frontend.
15. Coverage check only at end — should be checked after each slice.
