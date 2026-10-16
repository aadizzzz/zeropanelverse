# Drizzle ORM & Database Query Rules

## 1. Disambiguate Raw SQL Subquery Columns
When writing correlated subqueries or joins in Drizzle ORM using raw `sql\`...\``, **always explicitly qualify table names on columns** (e.g. `users.id`, `f.following_id`, `p.user_id`).
* **Root Cause**: If an interpolated parameter like `${users.id}` is evaluated inside a raw SQL fragment joining tables that both possess that column name (e.g. `titles.id`, `panels.id`, and `users.id`), Drizzle may emit an unqualified `"id"`, causing PostgreSQL to fail with `ERROR 42702: column reference "id" is ambiguous`.
* **Standard**:
  ```ts
  // INCORRECT (causes ambiguous id error in subqueries joining tables with 'id'):
  sql`(select count(*)::int from ${follows} where ${follows.followingId} = ${users.id})`

  // CORRECT (explicitly qualified):
  sql`(select count(*)::int from follows f where f.following_id = users.id)`
  ```

## 2. Avoid Silent Fallbacks for Dynamic/User Queries
* Catch blocks must not silently mask live database query failures by returning static or hardcoded arrays (e.g. fixed demo user arrays).
* Masking database errors with static mock data prevents newly registered users or updated records from ever appearing, causing hard-to-detect state divergence.
* Catch blocks must log the detailed error with `console.error` and return an explicit error state or empty live result rather than deceptive stale data.
