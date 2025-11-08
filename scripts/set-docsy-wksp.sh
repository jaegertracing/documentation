#!/usr/bin/env bash
#
# Helper script to set the WKSP environment variable based on the branch, or
# base branch of the current pull request. This is used to determine which
# workspace to use for the build: either the docsy-theme based site or the main
# site. Any base or branch name starting with "docsy" is considered a docsy
# workspace.
#
# cSpell:ignore docsy wksp RPROMPT

: ${RPROMPT:=} # This seems necessary when sourcing this script from zsh

branch="${BRANCH:-}"
if [[ -z "$branch" ]]; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
fi
base="${PULL_REQUEST_BASE_BRANCH:-${PULL_REQUEST_BASE:-}}"

echo "set-docsy-wksp:"
echo "  > branch: $branch"
echo "  > base: $base"

if [[ "$branch" == docsy* || "$base" == docsy* ]]; then
  echo "  Docsy workspace identified."
  if [[ -n "${WKSP:-}" && "$WKSP" == *docsy* ]]; then
    echo "  WKSP already set to ${WKSP}; skipping."
  else
    export WKSP="dev.yaml,hugo.docsy"
    echo "  Setting WKSP to ${WKSP}"
  fi
else
  echo "  Main workspace identified."
  if [[ -n "${WKSP:-}" ]]; then
    echo "  WARNING: WKSP was preset to ${WKSP}; resetting for main workspace."
    unset WKSP
  fi
fi
