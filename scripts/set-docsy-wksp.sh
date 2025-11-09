#!/bin/sh
#
# Helper script to set the WKSP environment variable based on the branch, or
# base branch of the current pull request. This is used to determine which
# workspace to use for the build: either the docsy-theme based site or the main
# site. Any base or branch name starting with "docsy" is considered a docsy
# workspace.
#
# cSpell:ignore docsy wksp RPROMPT

: "${RPROMPT:=}" # This seems necessary when sourcing this script from zsh

pr_branch="${PULL_REQUEST_BRANCH:-}"
branch="${BRANCH:-}"
if [ -z "$branch" ]; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
fi
base="${PULL_REQUEST_BASE_BRANCH:-${PULL_REQUEST_BASE:-}}"

echo "set-docsy-wksp:"
echo "  > pr_branch: $pr_branch"
echo "  > branch: $branch"
echo "  > base: $base"

is_docsy_workspace=false

case "$pr_branch" in
  docsy*) is_docsy_workspace=true ;;
esac

case "$branch" in
  docsy*) is_docsy_workspace=true ;;
esac

case "$base" in
  docsy*) is_docsy_workspace=true ;;
esac

if [ "$is_docsy_workspace" = true ]; then
  echo "  Docsy workspace identified."
  if [ -n "${WKSP:-}" ]; then
    case "$WKSP" in
      *docsy*)
        echo "  WKSP already set to ${WKSP}; skipping."
        ;;
      *)
        export WKSP="dev.yaml,hugo.docsy"
        echo "  Setting WKSP to ${WKSP}"
        ;;
    esac
  else
    export WKSP="dev.yaml,hugo.docsy"
    echo "  Setting WKSP to ${WKSP}"
  fi
else
  echo "  Main workspace identified."
  if [ -n "${WKSP:-}" ]; then
    echo "  WARNING: WKSP was preset to ${WKSP}; resetting for main workspace."
    unset WKSP
  fi
fi
