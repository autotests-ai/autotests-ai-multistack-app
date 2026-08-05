# backend-javascript-express

JavaScript [Express](https://expressjs.com/) JSON API on Node — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `reference_app_javascript_express`.

**Status:** active.

```
https://reference-app-copy.autotests.ai/backend-javascript-express/{frontend}/
https://reference-app-copy.autotests.ai/backend-javascript-express/api/
```

Unit tests: `tests/`. Run: `npm test`

Postgres access sits behind the store in `src/store.js`, so the suite runs against an
in-memory fake and needs no database.

Same language, Nest: [`backend-javascript-nest`](../backend-javascript-nest/).  
TypeScript Express: [`backend-typescript-express`](../../typescript/backend-typescript-express/).
