#!/usr/bin/env bash
# Render matrix vhost and apply under /etc/nginx (passwordless sudo).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GEN_DIR="${NGINX_GEN_DIR:-${SCRIPT_DIR}/generated}"
STATUSES="${NGINX_STATUSES:-active,stub}"

if [[ "$(id -u)" -ne 0 ]]; then
  if sudo -n true 2>/dev/null; then
    exec sudo env NGINX_GEN_DIR="$GEN_DIR" NGINX_STATUSES="$STATUSES" "$0" "$@"
  fi
  echo "Run as root or with passwordless sudo for sync-nginx.sh" >&2
  exit 1
fi

python "${SCRIPT_DIR}/render_vhosts.py" --out-dir "$GEN_DIR" --statuses "$STATUSES"

shopt -s nullglob
confs=("$GEN_DIR"/*.conf)
if [[ ${#confs[@]} -eq 0 ]]; then
  echo "No generated confs in $GEN_DIR" >&2
  exit 1
fi
if [[ ${#confs[@]} -ne 1 ]]; then
  echo "Expected exactly one vhost conf, got ${#confs[@]}" >&2
  exit 1
fi

conf_src="${confs[0]}"
base="$(basename "$conf_src" .conf)"
site_name="$base"
site_path="/etc/nginx/sites-available/${site_name}"
tmp="/tmp/nginx-${site_name}.generated"
ssl_snippet="/tmp/nginx-${site_name}.ssl-snippet"
ssl_domain="$base"

# Drop legacy subdomain / underscore hostnames
rm -f /etc/nginx/sites-enabled/reference-app-copy
rm -f /etc/nginx/sites-available/reference-app-copy
rm -f /etc/nginx/sites-enabled/backend_java_spring.reference-app-copy
rm -f /etc/nginx/sites-available/backend_java_spring.reference-app-copy
rm -f /etc/nginx/sites-enabled/backend-java-spring.reference-app-copy
rm -f /etc/nginx/sites-enabled/backend-python-flask.reference-app-copy
rm -f /etc/nginx/sites-enabled/backend-java-spring.reference-app-copy.autotests.ai
rm -f /etc/nginx/sites-enabled/backend-python-flask.reference-app-copy.autotests.ai

cp "$conf_src" "$tmp"

: >"$ssl_snippet"
if [[ -f "/etc/letsencrypt/live/${ssl_domain}/fullchain.pem" ]]; then
  {
    echo "    ssl_certificate /etc/letsencrypt/live/${ssl_domain}/fullchain.pem;"
    echo "    ssl_certificate_key /etc/letsencrypt/live/${ssl_domain}/privkey.pem;"
  } >>"$ssl_snippet"
elif [[ -f "$site_path" ]]; then
  grep -E '^\s*ssl_certificate(_key)? ' "$site_path" | awk '!seen[$0]++' >>"$ssl_snippet" || true
fi

if [[ -s "$ssl_snippet" ]]; then
  awk -v sslfile="$ssl_snippet" '
    /# ssl_certificate \.\.\.;/ {
      while ((getline line < sslfile) > 0) print line
      close(sslfile)
      next
    }
    { print }
  ' "$tmp" >"${tmp}.patched"
  mv "${tmp}.patched" "$tmp"
else
  echo "WARN: no ssl_certificate lines found for ${site_name}" >&2
fi

cp "$tmp" "$site_path"
ln -sf "$site_path" "/etc/nginx/sites-enabled/${site_name}"
echo "synced $site_path"

nginx -t
systemctl reload nginx
echo "OK: nginx reloaded (1 vhost)"
