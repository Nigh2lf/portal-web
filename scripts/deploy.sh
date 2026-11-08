#!/usr/bin/env bash
# Deploy of portal-web on the EC2 host. Run by GitHub Actions (.github/workflows/ci-cd.yml)
# after `git pull`, as the `ubuntu` user, from the repository root:
#
#   bash scripts/deploy.sh [expected_commit_sha]
#
# The build happens in place, so the site returns errors for the duration of `next build`
# (one to three minutes on this server). APP_DIR, SERVICE, PORT and HEALTH_HOST can be overridden.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/portal-web}"
SERVICE="${SERVICE:-portal-web}"
PORT="${PORT:-3000}"
HEALTH_HOST="${HEALTH_HOST:-portalpetro.rodrigolim.com.br}"
EXPECTED_SHA="${1:-}"

cd "$APP_DIR"

if [[ "$(id -un)" == "root" ]]; then
  echo "deploy.sh must run as the service user (ubuntu), not root" >&2
  exit 1
fi

CURRENT_SHA="$(git rev-parse HEAD)"
if [[ -n "$EXPECTED_SHA" && "$CURRENT_SHA" != "$EXPECTED_SHA" ]]; then
  echo "HEAD is $CURRENT_SHA but the workflow expected $EXPECTED_SHA" >&2
  exit 1
fi
echo "Deploying $CURRENT_SHA"

echo "==> npm ci"
npm ci --no-audit --no-fund

echo "==> next build"
npm run build

echo "==> restart $SERVICE"
sudo -n systemctl restart "$SERVICE"

# Disk is tight on this server: drop the npm cache right after installing.
npm cache clean --force >/dev/null 2>&1 || true

echo "==> health check http://127.0.0.1:$PORT/ (Host: $HEALTH_HOST)"
for _ in $(seq 1 20); do
  if curl -fsS -m 10 -o /dev/null -H "Host: $HEALTH_HOST" "http://127.0.0.1:$PORT/"; then
    echo "Deploy OK: $CURRENT_SHA"
    exit 0
  fi
  sleep 3
done

echo "Health check failed after restart" >&2
sudo -n systemctl status "$SERVICE" --no-pager | tail -n 20 >&2 || true
sudo -n journalctl -u "$SERVICE" --no-pager -n 40 >&2 || true
exit 1
