# backend-go-gin

Go [Gin](https://github.com/gin-gonic/gin) JSON API — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `reference_app_go_gin`.

**Status:** slot (not wired in compose until implemented).

```
https://reference-app-copy.autotests.ai/backend-go-gin/{frontend}/
```

Why Gin (not Echo/Chi/Fiber): most common course/tutorial stack for REST + middleware; still thin over `net/http`.  
Sibling without framework: [`backend-go-stdlib`](../backend-go-stdlib/) (Selenoid-style).
