#!/usr/bin/env bash
#
# This script runs the external link check on a schedule, so that a pull
# request never pays for a refcache that expired on a calendar. It runs the
# same htmltest configuration as CI, reports the links that fail in a GitHub
# issue, and when the oldest cache entry is within RENEW_WITHIN_DAYS of the
# expiry set in .htmltest.yml, it re-verifies every external link and opens a
# pull request with the refreshed data/refcache.json.
#
# The workflow .github/workflows/ci-link-cache.yml runs it weekly. It needs the
# gh CLI authenticated with a token that may open issues and pull requests.
#
# cSpell:ignore refcache

set -euo pipefail

RENEW_WITHIN_DAYS=${RENEW_WITHIN_DAYS:-14}
ISSUE_LABEL=link-check
CACHE=data/refcache.json
LOG=tmp/link-check.log

mkdir -p tmp

# A site that does not build is a different failure from a link that does not
# resolve, so the build runs on its own first and stops the script.
npm run build

# Runs the link check and keeps its output. The Makefile saves the refcache
# even when links fail.
run_check() {
  npm run check:links:all 2>&1 | tee "$LOG" | sed 's/\x1b\[[0-9;]*m//g' > "$LOG.plain"
}

# Prints "status page url" for every failure in the last run.
failures() {
  grep -E '^[[:space:]]*(Non-OK status|Broken|target does not exist|hash does not exist)' "$LOG.plain" |
    sed -E 's/^[[:space:]]*//; s/ --- / /; s/ --> / /' | sort -u || true
}

# Reads the expiry from .htmltest.yml, in hours, and prints the cutoff date:
# an entry last seen before it expires within RENEW_WITHIN_DAYS.
renewal_cutoff() {
  local hours
  hours=$(sed -nE 's/^CacheExpires:[[:space:]]*([0-9]+)h.*/\1/p' .htmltest.yml)
  [ -n "$hours" ] || { echo "CacheExpires not found in .htmltest.yml" >&2; exit 1; }
  python3 -c "
import datetime, sys
hours, within = int(sys.argv[1]), int(sys.argv[2])
cutoff = datetime.date.today() - datetime.timedelta(hours=hours) + datetime.timedelta(days=within)
print(cutoff.isoformat())" "$hours" "$RENEW_WITHIN_DAYS"
}

oldest_entry() {
  jq -r '[.[].LastSeen[:10]] | min // empty' "$CACHE"
}

report_issue() {
  local body=tmp/link-check-issue.md
  {
    echo "The scheduled link check found links that do not resolve. Each line is the HTTP status, the page that carries the link, and the link."
    echo
    echo '```'
    failures
    echo '```'
    echo
    echo "Run: $RUN_URL"
  } > "$body"
  gh label create "$ISSUE_LABEL" --force --description "Opened by the scheduled link check" >/dev/null 2>&1 || true
  local existing
  existing=$(gh issue list --label "$ISSUE_LABEL" --state open --json number --jq '.[0].number // empty')
  if [ -n "$existing" ]; then
    gh issue edit "$existing" --body-file "$body" >/dev/null
    echo "Updated issue #$existing"
  else
    gh issue create --title "Links that the scheduled link check cannot resolve" --label "$ISSUE_LABEL" --body-file "$body"
  fi
}

open_cache_pr() {
  local branch="refresh-refcache-$(date -u +%Y%m%d)"
  if [ -n "$(gh pr list --state open --search 'Refresh the link-check refcache in:title' --json number --jq '.[0].number // empty')" ]; then
    echo "A refresh PR is already open; not opening another."
    return
  fi
  git checkout -q -b "$branch"
  git add "$CACHE"
  git commit -q -s -m "chore(docs): Refresh the link-check refcache"
  git push -q -u origin "$branch"
  gh pr create --base main --head "$branch" \
    --title "chore(docs): Refresh the link-check refcache" \
    --body "Every external link was re-verified by the scheduled link check, so each cache entry carries today's date and none expires within the next three months. Run: $RUN_URL"
}

RUN_URL=${RUN_URL:-local}

echo "== Checking links against the committed cache"
run_check || true
if [ -n "$(failures)" ]; then
  echo "== Failing links:"; failures
  report_issue
fi
git checkout -q -- "$CACHE"

cutoff=$(renewal_cutoff)
oldest=$(oldest_entry)
echo "== Oldest cache entry: ${oldest:-none}; renewal cutoff: $cutoff"
if [ -n "$oldest" ] && [[ "$oldest" < "$cutoff" ]]; then
  echo "== Re-verifying every external link"
  echo '{}' > "$CACHE"
  run_check || true
  if [ -n "$(failures)" ]; then
    echo "== Failing links after a cold run:"; failures
    report_issue
  fi
  open_cache_pr
else
  echo "== Cache is fresh; nothing to do."
fi
