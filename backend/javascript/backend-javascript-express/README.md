# backend-javascript-express

JavaScript [Express](https://expressjs.com/) JSON API on Node — same OpenAPI contract as `backend-java-spring`
(`/api/health`, items, auth/JWT). Copy: [`resources/openapi.yaml`](resources/openapi.yaml)
(`GET /api/openapi.yaml`, `GET /api/docs`).
Postgres DB: `multistack_app_javascript_express`.

**Status:** active.

```
https://autotests.ai/stack/backend-javascript-express/{frontend}/
https://autotests.ai/stack/backend-javascript-express/api/
```

Unit tests: `tests/`. Run: `npm test`

Postgres access sits behind the store in `src/store.js`, so the suite runs against an
in-memory fake and needs no database.

Same language, Nest: [`backend-javascript-nest`](../backend-javascript-nest/).  
TypeScript Express: [`backend-typescript-express`](../../typescript/backend-typescript-express/).
