#!/usr/bin/env bash

# Copyright (c) 2024 The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0

# Prepares a pull request for the next release.
# Set environment varibale DRY_RUN=true to skip committing the changes.

set -euf -o errexit -o pipefail

print_usage() {
  echo "Usage: $0 <version_v1> <version_v2>"
  echo "  Both versions must be in #.#.# format (major, minor, patch)"
  exit 1
}

if [ "$#" -ne 2 ]; then
  print_usage
fi

if [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  version_v1="$1"
else
  echo "🔴 ERROR: Version $1 is not in in major.minor.patch format."
  print_usage
fi
if [[ "$2" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  version_v2="$2"
else
  echo "🔴 ERROR: Version $2 is not in in major.minor.patch format."
  print_usage
fi

safe_checkout_main() {
  # We need to be on a branch to be able to create commits,
  # and we want that branch to be main, which has been checked before.
  # But we also want to make sure that we build and release exactly the tagged version, so we verify that the remote
  # branch is where our tag is.
  local checkoutBranch=main
  if [[ "$DRY_RUN" = "true" ]]; then
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

gen_cli_docs_v1() {
  local versionMajorMinor=$1
  # we set this as a temp dir with write permissions to everyone to overcome #441
  # we then set the permissions back to sane levels once we are done
  cliDocsTempDir=$(mktemp -d -t cli-docs-XXXXXXXX)
  mkdir -p ${cliDocsTempDir}/data/cli
  cp -r ./data/cli/next-release/ ${cliDocsTempDir}/data/cli/${versionMajorMinor}
  chmod -R a+w ${cliDocsTempDir}
  python ./scripts/gen-cli-data.py ${versionMajorMinor} ${cliDocsTempDir}
  rm -f ${cliDocsTempDir}/data/cli/${versionMajorMinor}/*_completion_*.yaml
  mv ${cliDocsTempDir}/data/cli/${versionMajorMinor} ./data/cli/
}

set -x
safe_checkout_main

for version in "${version_v1}" "${version_v2}"; do
  versionMajorMinor=$(echo "${version}" | sed 's/\.[[:digit:]]$//')
  echo "Creating new documentation for ${version} (${versionMajorMinor})"
  var_suffix=""
  if [[ "${versionMajorMinor}" == 2* ]]; then
    cp -r ./content/docs/next-release-v2/ ./content/docs/${versionMajorMinor}
    var_suffix="V2"
  else
    cp -r ./content/docs/next-release/ ./content/docs/${versionMajorMinor}
    # @nocommit skip this
    # gen_cli_docs_v1 ${versionMajorMinor}
  fi

  versions=$(grep -E "versions${var_suffix} *=" config.toml)
  if [[ "$versions" == *"$versionMajorMinor"* ]]; then
    echo "🔴 ERROR: Version ${versionMajorMinor} is already included in the versions list."
    exit 1
  fi

  sed -i -e "s/latest${var_suffix} *=.*$/latest${var_suffix} = \"${versionMajorMinor}\"/" config.toml
  sed -i -e "s/binariesLatest${var_suffix} *=.*$/binariesLatest${var_suffix} = \"${version}\"/" config.toml
  sed -i -e "s/versions${var_suffix} *= *\[/versions${var_suffix} = \[\"${versionMajorMinor}\"\,/" config.toml
done

if [[ "$DRY_RUN" = "true" ]]; then
  echo "Not committing changes because DRY_RUN=$DRY_RUN"
  exit 0
fi
git add config.toml ./content/docs/${versionMajorMinor} ./data/cli/${versionMajorMinor}
git commit -m "Release ${version}" -s
