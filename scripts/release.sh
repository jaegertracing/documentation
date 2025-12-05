#!/usr/bin/env bash

# Copyright (c) 2024 The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0

# Prepares a pull request for the next release.
# Set environment variable DRY_RUN=true to skip committing the changes.

set -euf -o errexit -o pipefail

DRY_RUN=${DRY_RUN:-false}
SED=${SED:-sed}
config_file=hugo.yaml

print_usage() {
  echo "Usage: $0 <version_v2>"
  echo "  Version must be in #.#.# format (major, minor, patch)"
  exit 1
}

if [ "$#" -ne 1 ]; then
  print_usage
fi

if [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  version_v2="$1"
else
  echo "🔴 ERROR: Version $1 is not in a major.minor.patch format."
  print_usage
fi

safe_checkout_main() {
  # We need to be on a branch to be able to create commits,
  # and we want that branch to be main, which has been checked before.
  # But we also want to make sure that we build and release exactly the tagged version, so we verify that the remote
  # branch is where our tag is.
  local checkoutBranch=main
  if [[ "$DRY_RUN" != "false" ]]; then
    echo "Skipping branch validation"
    return
  fi
  git remote -v
  git checkout -B "${checkoutBranch}"
  git fetch origin "${checkoutBranch}":origin/"${checkoutBranch}"
  commit_local_main="$(git rev-parse ${checkoutBranch})"
  commit_remote_main="$(git rev-parse origin/${checkoutBranch})"
  if [ "$commit_local_main" != "$commit_remote_main" ]; then
    echo "${checkoutBranch} on remote 'origin' has commits since the version under release, aborting"
    exit 1
  fi
}

update_links() {
  local versionMajorMinor=$1
  local version=$2
  local versionTag="v${version}"
  versionMajor=$(echo "${versionMajorMinor}" | ${SED} 's/\.[[:digit:]]*$//')
  versionMinor=$(echo "${versionMajorMinor}" | ${SED} 's/[[:digit:]]\.//')
  weight=$(printf "%d%02d\n" "$versionMajor" "$versionMinor")
  # For the _index.md of the current versions, edit the front matter to:
  # - Set 'robots' to `false` in the cascade
  # - Remove "(latest)" from the linkTitle
  find ./content/docs/v${versionMajor}/ \
    -name "_index.md" -not -path "*/_dev/*" -not -path "*/${versionMajorMinor}/*" \
    -type f -exec ${SED} -i \
      -e "s|^\(cascade:\s*{\s*robots:\s*\)true\(.*\)$|\1false\2|g; s|^\(linkTitle: [12]\.[0-9]*\) (latest)$|\1|g" {} \;
  # loop over a collection of string patterns
  for pattern in \
    "s|https://github.com/jaegertracing/jaeger/tree/main|https://github.com/jaegertracing/jaeger/tree/${versionTag}|g" \
    "s|https://github.com/jaegertracing/jaeger/blob/main|https://github.com/jaegertracing/jaeger/blob/${versionTag}|g" \
    "s|^linkTitle: [12].dev.*$|linkTitle: ${versionMajorMinor} (latest)|g" \
    "s|^weight: -[12]00.*$|weight: -${weight}|g"
  do
    find ./content/docs/v${versionMajor}/${versionMajorMinor} -type f -exec ${SED} -i -e "${pattern}" {} \;
  done
}

set -x
safe_checkout_main

versionMajorMinor=$(echo "${version_v2}" | ${SED} 's/\.[[:digit:]]$//')
echo "Creating new documentation for ${version_v2} (${versionMajorMinor})"

cp -r ./content/docs/v2/_dev/ ./content/docs/v2/${versionMajorMinor}

update_links "${versionMajorMinor}" "${version_v2}"

versions=$(grep -E "versionsV2 *:" "${config_file}")
if [[ "$versions" == *"$versionMajorMinor"* ]]; then
  echo "🔴 ERROR: Version ${versionMajorMinor} is already included in the versions list."
  exit 1
fi

${SED} -i -e "s/latestV2 *:.*$/latestV2: \"${versionMajorMinor}\"/" "${config_file}"
${SED} -i -e "s/binariesLatestV2 *:.*$/binariesLatestV2: \"${version_v2}\"/" "${config_file}"
${SED} -i -e "s/versionsV2 *: *\[/versionsV2: \[\"${versionMajorMinor}\"\,/" "${config_file}"

if [[ "$DRY_RUN" != "false" ]]; then
  echo "Not committing changes because DRY_RUN=$DRY_RUN"
  exit 0
fi

BRANCH="gen-release-${version_v2}"
git checkout -b "$BRANCH" # branch is needed for GH CLI
git add ${config_file} ./content/docs/
git commit -s -m "Release ${version_v2}"
git push origin HEAD:"$BRANCH" # branch has to be on remote before PR is opened
