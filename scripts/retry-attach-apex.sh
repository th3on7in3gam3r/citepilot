#!/usr/bin/env bash
# Retry attaching getcitepilot.com to Blueprint citepilot after releasing it from flu8.
# Usage: RENDER_API_KEY=… ./scripts/retry-attach-apex.sh
# Or rely on ~/.render/cli.yaml
set -euo pipefail
PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/opt/homebrew/bin:$PATH"

CITEPILOT=srv-d9fmicj7uimc73f0anog
if [[ -z "${RENDER_API_KEY:-}" ]]; then
  RENDER_API_KEY=$(python3 -c "
import re
t=open('$HOME/.render/cli.yaml').read()
m=re.search(r'key:\s*(rnd_[A-Za-z0-9]+)', t)
print(m.group(1) if m else '')
")
fi
if [[ -z "$RENDER_API_KEY" ]]; then
  echo "RENDER_API_KEY missing" >&2
  exit 1
fi

echo "Releasing tip: In the Render account that owns flu8, open"
echo "  https://dashboard.render.com/web/srv-d9fr5pn41pts73epechg"
echo "  Settings → Custom Domains → delete getcitepilot.com and www.getcitepilot.com"
echo

for domain in getcitepilot.com; do
  echo "Attaching $domain → $CITEPILOT"
  code=$(curl -sS -o /tmp/attach-apex.json -w "%{http_code}" -X POST \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    "https://api.render.com/v1/services/$CITEPILOT/custom-domains" \
    -d "{\"name\":\"$domain\"}")
  echo "HTTP $code $(head -c 200 /tmp/attach-apex.json)"
  if [[ "$code" != "200" && "$code" != "201" ]]; then
    exit 2
  fi
done

echo "List:"
curl -sS -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$CITEPILOT/custom-domains"
echo
echo "DNS: keep A @ → 216.24.57.1 ; set www CNAME → citepilot.onrender.com (or redirect to apex)"
echo "Then: curl -H \"X-Health-Secret: \$HEALTH_SECRET\" https://getcitepilot.com/api/health"
