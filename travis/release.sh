#!/usr/bin/env bash

set -x -u -o errexit -o nounset -o pipefail

safe_checkout_master() {
  # We need to be on a branch to be able to create commits,
  # and we want that branch to be master, which has been checked before.
  # But we also want to make sure that we build and release exactly the tagged version, so we verify that the remote
  # branch is where our tag is.
  checkoutBranch=master
  git checkout -B "${checkoutBranch}"
  git fetch origin "${checkoutBranch}":origin/"${checkoutBranch}"
  commit_local_master="$(git show --pretty='format:%H' ${checkoutBranch})"
  commit_remote_master="$(git show --pretty='format:%H' origin/${checkoutBranch})"
  if [ "$commit_local_master" != "$commit_remote_master" ]; then
    echo "${checkoutBranch} on remote 'origin' has commits since the version under release, aborting"
    exit 1
  fi
}

if [[ "$TRAVIS_TAG" =~ ^release-[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+?$ ]]; then
    echo "We are on release-x.y.z tag: $TRAVIS_TAG"
    safe_checkout_master
    version=$(echo "${TRAVIS_TAG}" | sed 's/^release-//')
    versionMajorMinor=$(echo "${version}" | sed 's/\.[[:digit:]]$//')
    echo "Creating new documentation for ${version}"
    cp -r ./content/docs/next-release/ ./content/docs/${versionMajorMinor}

    # we set this as a temp dir with write permissions to everyone to overcome #441
    # we then set the permissions back to sane levels once we are done
    cliDocsTempDir=$(mktemp -d -t cli-docs-XXXXXXXX)
    mkdir -p ${cliDocsTempDir}/data/cli
    cp -r ./data/cli/next-release/ ${cliDocsTempDir}/data/cli/${versionMajorMinor}
    chmod a+w -R ${cliDocsTempDir}
    python ./travis/gen-cli-data.py ${versionMajorMinor} ${cliDocsTempDir}
    mv ${cliDocsTempDir}/data/cli/${versionMajorMinor} ./data/cli/
    sed -i -e "s/latest *=.*$/latest = \"${versionMajorMinor}\"/" config.toml
    sed -i -e "s/binariesLatest *=.*$/binariesLatest = \"${version}\"/" config.toml
    sed -i -e "s/versions *= *\[/versions = \[\"${versionMajorMinor}\"\,/" config.toml
    if [[ "$DRY_RUN" = "true" ]]; then
      echo "Not committing changes because DRY_RUN=$DRY_RUN"
      exit 0
    fi
    git add config.toml ./content/docs/${versionMajorMinor} ./data/cli/${versionMajorMinor}
    git commit -m "Release ${version}" -s
    git push origin master
else
    echo "TRAVIS_TAG=$TRAVIS_TAG is not in the form release-x.y.z, skipping release"
fi
