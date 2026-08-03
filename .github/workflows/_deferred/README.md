# Deferred workflows (block 2+)

These files were forked from [reference-app](https://github.com/autotests-ai/reference-app) but are **not** in `.github/workflows/` root, so GitHub Actions does not execute them.

| File | Original role |
|------|----------------|
| `reference_github-pyramid.yml` | CI + prod pyramid (Gradle layers) |
| `reference_github-build-backend.yml` | bootJar + Docker image artifact |
| `reference_github-sonar.yml` | SonarQube gate |
| `reference_visual_baselines.yml` | Visual baseline refresh |
| `telegram-topic-probe.yml` | Telegram topic probe |

Block 2 plan: **one** test workflow; add pyramid layers inside it incrementally — do not re-enable these as separate Actions entries without explicit OK.
