# backend-typescript-express

TypeScript [Express](https://expressjs.com/) JSON API on Node — same OpenAPI contract as `backend-java-spring`
(`/api/health`, items, auth/JWT). Copy: [`resources/openapi.yaml`](resources/openapi.yaml)
(`GET /api/openapi.yaml`, `GET /api/docs`).
Postgres DB: `multistack_app_typescript_express`.

**Status:** active.

```
https://autotests.ai/stack/backend-typescript-express/{frontend}/
https://autotests.ai/stack/backend-typescript-express/api/
```

Unit tests: `tests/` (Jest + ts-jest, no database required).  
Run: `npm ci && npm test`  
Build: `npm run build` → `dist/`, started with `npm start`.

## Layout

```
src/
  app.ts server.ts config.ts store.ts seed.ts validation.ts
  db/ middleware/ routes/ security/
schema.sql
```

`store.ts` is the persistence seam: routes depend on the `Store` interface, `db/postgres-store.ts`
implements it over `pg`, and tests swap in an in-memory fake. `BIGSERIAL` ids are coerced to numbers
so `/api/items` serialises `id` as JSON number.

Same language, Nest stack: [`backend-typescript-nest`](../backend-typescript-nest/).  
JavaScript Express: [`backend-javascript-express`](../../javascript/backend-javascript-express/).
