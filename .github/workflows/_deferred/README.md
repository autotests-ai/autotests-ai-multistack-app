# Deferred workflows

Not in `.github/workflows/` root — GitHub Actions does not execute them.

Superseded by active `ci.yml` / `test.yml` / `deploy.yml` (removed): pyramid, build-backend.

| File | Role (wire later) |
|------|-------------------|
| `reference_github-sonar.yml` | SonarQube gate |
| `reference_visual_baselines.yml` | Visual baseline refresh |
| `telegram-topic-probe.yml` | Telegram topic probe |
