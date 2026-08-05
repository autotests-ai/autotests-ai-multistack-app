# backend-javascript-nest

JavaScript [NestJS](https://nestjs.com/) JSON API on Node — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `reference_app_javascript_nest`.

**Status:** active. Teaching twin of the usual TS Nest path.

```
https://reference-app-copy.autotests.ai/backend-javascript-nest/{frontend}/
https://reference-app-copy.autotests.ai/backend-javascript-nest/api/
```

Unit tests: `tests/`. Run: `npm test`

Postgres access sits behind the store provided under the `STORE` token, so the suite
runs against an in-memory fake and needs no database.

## Plain-JavaScript Nest

Sources are `.js`; Babel compiles class and method decorators (`npm run build` → `dist/`).
Parameter decorators have no JavaScript syntax, so constructor and route parameters get
their Nest metadata from `src/di.js`, which calls `Inject()`, `Body()` and `Req()`
directly. Dependencies are always named by an explicit token because JavaScript emits no
`design:paramtypes`.

Same language, thinner stack: [`backend-javascript-express`](../backend-javascript-express/).  
TypeScript Nest: [`backend-typescript-nest`](../../typescript/backend-typescript-nest/).
