#!/usr/bin/env bash
# Render matrix vhosts and apply them under /etc/nginx (passwordless sudo).
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

# Drop legacy single-stack / underscore hostnames
rm -f /etc/nginx/sites-enabled/reference-app-copy
rm -f /etc/nginx/sites-available/reference-app-copy
rm -f /etc/nginx/sites-enabled/backend_java_spring.reference-app-copy
rm -f /etc/nginx/sites-available/backend_java_spring.reference-app-copy

for conf_src in "${confs[@]}"; do
  base="$(basename "$conf_src" .conf)"
  # site name: first label of public host (backend-java-spring.reference-app-copy)
  site_name="${base%.autotests.ai}"
  site_path="/etc/nginx/sites-available/${site_name}"
  tmp="/tmp/nginx-${site_name}.generated"
  ssl_snippet="/tmp/nginx-${site_name}.ssl-snippet"
  ssl_domain="$base"

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
done

# Remove old monolithic conf if present (replaced by Host-split vhosts)
rm -f /etc/nginx/sites-enabled/backend-java-spring.reference-app-copy
# keep sites-available backup? drop enabled only when generated replaces —
# generated uses same site_name backend-java-spring.reference-app-copy

nginx -t
systemctl reload nginx
echo "OK: nginx reloaded (${#confs[@]} vhost(s))"
