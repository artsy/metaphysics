#!/bin/bash

# Description: Reap stale Metaphysics review apps. A review app is stale once its
# branch (review-app-<name>) has been deleted or hasn't been pushed within the
# TTL. For each stale app this deletes the Kubernetes namespace, the Cloudflare
# CNAME, and the ECR image.
#
# Runs daily from CircleCI (see the reap-review-apps workflow). DRY_RUN defaults
# to true so it only reports; set DRY_RUN=false to actually delete.
#
# Safety: only ever touches namespaces labelled artsy.io/review-app=true, so it
# can never select metaphysics-web, staging, or system namespaces.
#
# USAGE: $ DRY_RUN=false ./scripts/reap-review-apps.sh

set -uo pipefail

TTL_DAYS=${REVIEW_APP_TTL_DAYS:-21}
DRY_RUN=${DRY_RUN:-true}
WARN_WITHIN_DAYS=3
CLOUDFLARE_API_URL="https://api.cloudflare.com/client/v4"
KUBECTL="kubectl --context staging"

now=$(date +%s)
reaped=()
would_reap=()
expiring=()

if [ "$DRY_RUN" != "false" ]; then
  echo "[reap] DRY RUN — reporting only. Set DRY_RUN=false to delete. (TTL=${TTL_DAYS}d)"
else
  echo "[reap] LIVE — stale review apps will be deleted. (TTL=${TTL_DAYS}d)"
  if [ -z "${CLOUDFLARE_ZONE_ID:-}" ] || [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    echo "[reap] ERROR: CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN required to delete CNAMEs."
    exit 1
  fi
fi

delete_cname() {
  local ns="$1" subdomain="metaphysics-$1" id
  id=$(curl -sf -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "$CLOUDFLARE_API_URL/zones/$CLOUDFLARE_ZONE_ID/dns_records?type=CNAME&name=$subdomain.artsy.net" \
    | jq -r '.result[0].id // empty')
  if [ -z "$id" ]; then
    echo "[reap]   no CNAME found for $subdomain.artsy.net"
    return
  fi
  if curl -sf -X DELETE -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    "$CLOUDFLARE_API_URL/zones/$CLOUDFLARE_ZONE_ID/dns_records/$id" >/dev/null; then
    echo "[reap]   deleted CNAME $subdomain.artsy.net"
  else
    echo "[reap]   WARNING: failed to delete CNAME $subdomain.artsy.net"
  fi
}

reap() {
  local ns="$1"
  # Best effort: a failure in one resource must not stop the others or the sweep.
  $KUBECTL delete namespace "$ns" --wait=false || echo "[reap]   WARNING: failed to delete namespace $ns"
  delete_cname "$ns"
  aws ecr batch-delete-image --repository-name metaphysics --region us-east-1 \
    --image-ids imageTag="$ns" >/dev/null 2>&1 || echo "[reap]   no ECR image tag $ns (or delete failed)"
}

namespaces=$($KUBECTL get namespace -l artsy.io/review-app=true -o jsonpath='{.items[*].metadata.name}')

if [ -z "$namespaces" ]; then
  echo "[reap] No review-app namespaces found. Nothing to do."
  exit 0
fi

for ns in $namespaces; do
  branch=$($KUBECTL get namespace "$ns" -o jsonpath='{.metadata.annotations.artsy\.io/review-app-branch}' 2>/dev/null)
  [ -z "$branch" ] && branch="review-app-$ns"

  reason=""
  # --exit-code: 0 = ref exists, 2 = no such ref (deleted), anything else
  # (e.g. 128) = network/auth error. Only 2 is safe to treat as deleted —
  # otherwise a transient failure would reap a live app once armed.
  git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1
  rc=$?
  case $rc in
    0)
      # Prefer the last-deploy time we stamp on every build/update — it tracks
      # "when CI last deployed this app", which is what the lease is really about.
      # Fall back to the branch HEAD commit date only for apps stamped before this
      # annotation existed.
      last=$($KUBECTL get namespace "$ns" -o jsonpath='{.metadata.annotations.artsy\.io/review-app-deployed-at}' 2>/dev/null)
      if [ -z "$last" ]; then
        git fetch --depth=1 origin "$branch" >/dev/null 2>&1
        last=$(git log -1 --format=%ct FETCH_HEAD 2>/dev/null)
      fi
      if [ -n "$last" ]; then
        age_days=$(( (now - last) / 86400 ))
        if [ "$age_days" -gt "$TTL_DAYS" ]; then
          reason="branch $branch idle ${age_days}d (> ${TTL_DAYS}d)"
        elif [ "$(( TTL_DAYS - age_days ))" -le "$WARN_WITHIN_DAYS" ]; then
          expiring+=("$ns (idle ${age_days}d, expires in $(( TTL_DAYS - age_days ))d)")
        fi
      fi
      ;;
    2)
      reason="branch $branch deleted"
      ;;
    *)
      echo "[reap]   WARNING: ls-remote failed for $branch (exit $rc), skipping"
      continue
      ;;
  esac

  if [ -n "$reason" ]; then
    if [ "$DRY_RUN" = "false" ]; then
      echo "[reap] reaping $ns — $reason"
      reap "$ns"
      reaped+=("$ns — $reason")
    else
      echo "[reap] would reap $ns — $reason"
      would_reap+=("$ns — $reason")
    fi
  fi
done

print_list() {
  # Guarded so an empty array doesn't trip `set -u` on older bash.
  local label="$1"; shift
  echo "[reap] $label: $#"
  [ "$#" -gt 0 ] && printf '[reap]   - %s\n' "$@"
}

echo
echo "[reap] ===== summary ====="
if [ "$DRY_RUN" = "false" ]; then
  print_list "reaped" ${reaped[@]+"${reaped[@]}"}
else
  print_list "would reap" ${would_reap[@]+"${would_reap[@]}"}
fi
[ "${#expiring[@]}" -gt 0 ] && print_list "expiring soon" "${expiring[@]}"

# Optional Slack summary.
if [ -n "${REVIEW_APP_REAPER_SLACK_WEBHOOK:-}" ]; then
  if [ "$DRY_RUN" = "false" ]; then summary="Reaped ${#reaped[@]} stale review app(s)."; else summary="[dry run] ${#would_reap[@]} review app(s) would be reaped."; fi
  [ "${#expiring[@]}" -gt 0 ] && summary="$summary ${#expiring[@]} expiring soon."
  curl -sf -X POST -H "Content-Type: application/json" \
    --data "{\"text\": \"$summary\"}" "$REVIEW_APP_REAPER_SLACK_WEBHOOK" >/dev/null || true
fi
