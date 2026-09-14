/**
 * Stand + injection knobs for the Gatling TypeScript SDK (Graal, not Node APIs).
 * Seed user matches testdata-user: user1 / password1.
 * Pass knobs as `npx gatling run key=value` — process.env is Node-only.
 */
import { getEnvironmentVariable, getParameter } from "@gatling.io/core";

function firstNonBlank(...values: Array<string | undefined | null>): string {
  for (const value of values) {
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function parseIntOr(raw: string, fallback: number): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

function jsonEscape(value: string): string {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function apiBaseUrl(): string {
  return stripTrailingSlash(
    firstNonBlank(getParameter("apiBaseUrl"), getEnvironmentVariable("API_BASE_URL"), "http://localhost:8800"),
  );
}

export function username(): string {
  return firstNonBlank(getParameter("username"), getEnvironmentVariable("LOAD_USERNAME"), "user1");
}

export function password(): string {
  return firstNonBlank(getParameter("password"), getEnvironmentVariable("LOAD_PASSWORD"), "password1");
}

export function profile(): string {
  return firstNonBlank(getParameter("profile"), getEnvironmentVariable("GATLING_PROFILE"), "smoke").toLowerCase();
}

export function users(): number {
  return Math.max(1, parseIntOr(firstNonBlank(getParameter("users"), getEnvironmentVariable("GATLING_USERS"), "1"), 1));
}

export function duringSeconds(): number {
  return Math.max(
    1,
    parseIntOr(firstNonBlank(getParameter("duringSeconds"), getEnvironmentVariable("GATLING_DURING_SECONDS"), "30"), 30),
  );
}

export function p95Ms(): number {
  return Math.max(1, parseIntOr(firstNonBlank(getParameter("p95Ms"), getEnvironmentVariable("GATLING_P95_MS"), "2000"), 2000));
}

export function allowPublic(): boolean {
  return firstNonBlank(getParameter("allowPublic"), getEnvironmentVariable("GATLING_ALLOW_PUBLIC"), "false").toLowerCase() === "true";
}

export function loginJson(): string {
  return `{"username":"${jsonEscape(username())}","password":"${jsonEscape(password())}"}`;
}

export function refuseSharedProd(baseUrl: string): void {
  const lower = baseUrl.toLowerCase();
  const shared = lower.includes("autotests.ai") || lower.includes("qa.guru");
  if (shared && !allowPublic()) {
    throw new Error(
      `Refusing ${baseUrl} — isolated SUT only. Pass allowPublic=true when the host is a dedicated load stand.`,
    );
  }
}
