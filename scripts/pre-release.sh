#!/usr/bin/env bash
#
# This script prepares a documentation release from the maintainer's machine.
# It checks that every link from the _dev pages into the main branch of the
# jaeger repository also resolves at the tag of the release, because the
# release workflow rewrites those links to the tag and a file that moved before
# the tag fails the link check on the release pull request. When every link
# resolves, it offers to trigger the Release workflow with the same version.
#
#   scripts/pre-release.sh <major.minor.patch>   # a leading v is accepted
#
# It exits with status 1 and lists the links to fix in _dev when any is missing
# at the tag.

set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Usage: $0 <major.minor.patch>" >&2
  exit 1
fi
version=${1#v}
tag="v$version"
repo=https://github.com/jaegertracing/jaeger

status() {
  curl -sS -o /dev/null -w '%{http_code}' -I -L "$1"
}

if [[ "$(status "$repo/releases/tag/$tag")" != 200 ]]; then
  echo "🔴 Tag $tag does not exist in $repo; release Jaeger before its documentation." >&2
  exit 1
fi

links=$(grep -rhoE "$repo/(blob|tree)/main/[^)\"' >#]+" content/docs/v2/_dev | sort -u)
echo "Checking $(wc -l <<<"$links" | tr -d ' ') links from _dev against $tag"

missing=0
while IFS= read -r link; do
  tagged=${link/\/main\//\/$tag\/}
  code=$(status "$tagged")
  if [[ "$code" != 200 ]]; then
    missing=$((missing + 1))
    echo "🔴 $code $tagged"
    grep -rl --include='*.md' "$link" content/docs/v2/_dev | sed 's/^/     in /'
  fi
done <<<"$links"

if (( missing > 0 )); then
  echo "🔴 $missing links from _dev do not resolve at $tag. Fix them in _dev before releasing."
  exit 1
fi
echo "✅ All links from _dev resolve at $tag."

read -r -p "Trigger the Release workflow for $version now? [y/N] " answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
  gh workflow run ci-release.yml --repo jaegertracing/documentation \
    -f "version_v2=$version" -f dry_run=false
  echo "Watch it at https://github.com/jaegertracing/documentation/actions/workflows/ci-release.yml"
fi
