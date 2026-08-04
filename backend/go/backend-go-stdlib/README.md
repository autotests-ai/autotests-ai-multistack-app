# backend-go-stdlib

Go JSON API on **stdlib only** (`net/http`, `http.ServeMux`) — same OpenAPI contract as `backend-java-spring`.  
Postgres DB: `reference_app_go_stdlib`.

**Status:** slot (not wired in compose until implemented).

```
https://reference-app-copy.autotests.ai/backend-go-stdlib/{frontend}/
```

Pair with [`backend-go-gin`](../backend-go-gin/): Gin = product-course ergonomics; stdlib = infra-style Go (Selenoid/GGR mental model). Do not rewrite Selenoid onto Gin — teach both here instead.
