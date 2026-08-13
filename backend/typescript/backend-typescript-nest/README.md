# backend-typescript-nest

TypeScript [NestJS](https://nestjs.com/) JSON API on Node — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `reference_app_typescript_nest`.

**Status:** active.

```
https://autotests.ai/stack/backend-typescript-nest/{frontend}/
https://autotests.ai/stack/backend-typescript-nest/api/
```

Unit tests: `tests/` (Jest + ts-jest + `@nestjs/testing`, no database required).  
Run: `npm ci && npm test`  
Build: `npm run build` → `dist/`, started with `npm start`.

## Layout

```
src/
  main.ts bootstrap.ts app.module.ts config.ts config.module.ts
  api/     ApiController · ItemsService
  auth/    AuthController · AuthService · JwtAuthGuard · CurrentUser
  common/  ApiException · MessageExceptionFilter · validation
  security/ JwtService · password
  store/   Store seam · PostgresStore · schema · seed
schema.sql
```

`StoreModule.forStore()` binds the persistence seam: `main.ts` passes a `PostgresStore` over `pg`,
tests pass an in-memory fake. `MessageExceptionFilter` strips Nest's error envelope so every failure
is exactly `{"message": "..."}`. `BIGSERIAL` ids are coerced to numbers so `/api/items` serialises
`id` as JSON number.

Same language, Express stack: [`backend-typescript-express`](../backend-typescript-express/).  
JavaScript Nest: [`backend-javascript-nest`](../../javascript/backend-javascript-nest/).
