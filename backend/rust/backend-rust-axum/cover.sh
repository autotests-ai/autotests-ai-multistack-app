#!/usr/bin/env bash
# Coverlet analog: overall line coverage ≥ 80% (qa-guru-canon).
# Unit tests only (FakeStore) — no live Postgres required.
set -euo pipefail
cd "$(dirname "$0")"

if ! rustup component list --installed 2>/dev/null | grep -q '^llvm-tools-preview'; then
  echo "Installing llvm-tools-preview (cargo-llvm-cov)..." >&2
  rustup component add llvm-tools-preview
fi

if ! cargo llvm-cov --version >/dev/null 2>&1; then
  echo "Installing cargo-llvm-cov (backend coverage gate)..." >&2
  cargo install cargo-llvm-cov --locked
fi

# --lib: crate unit tests. Postgres #[cfg(test)] skips without TEST_DATABASE_URL.
# --fail-under-lines on the lcov pass so both reports exist before the floor check.
# Binary entrypoint is out of scope (--lib); do not hide postgres.rs.
cargo llvm-cov --lib --locked --json --output-path coverage.json
cargo llvm-cov --lib --locked --lcov --output-path coverage.lcov \
  --fail-under-lines 80
