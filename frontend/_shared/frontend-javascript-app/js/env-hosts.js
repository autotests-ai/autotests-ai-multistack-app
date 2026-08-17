/**
 * Matrix clone hosts for the header Stage/Prod switchers.
 * Twin: `frontend/_shared/env-hosts.ts` (SPA headerConfig).
 *
 * `PUBLIC_HOST` = `deploy/matrix.yaml` `public_host`.
 * Stage is the `stage.` prefix of that host — not a second YAML key.
 */

export const PUBLIC_HOST = 'autotests.ai';

export const PROD_ORIGIN = 'https://' + PUBLIC_HOST;
export const STAGE_ORIGIN = 'https://stage.' + PUBLIC_HOST;

export function envNavItems() {
  return [
    {
      href: STAGE_ORIGIN + '/',
      label: 'Stage',
      testid: 'header-nav-stage',
      match: 'host',
    },
    {
      href: PROD_ORIGIN + '/',
      label: 'Prod',
      testid: 'header-nav-prod',
      match: 'host',
    },
  ];
}
