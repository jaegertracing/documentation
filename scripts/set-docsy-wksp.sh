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

# For Netlify docs on meta vars, see
# https://docs.netlify.com/build/configure-builds/environment-variables/#git-metadata

branch="${HEAD:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)}"

echo "set-docsy-wksp:"
echo "  > branch: $branch"

is_docsy_workspace=false
WKSP_FOR_DOCSY="dev.yaml,hugo.docsy"

case "$branch" in
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
        export WKSP="${WKSP_FOR_DOCSY}"
        echo "  Setting WKSP to ${WKSP}"
        ;;
    esac
  else
    export WKSP="${WKSP_FOR_DOCSY}"
    echo "  Setting WKSP to ${WKSP}"
  fi
else
  echo "  Main workspace identified."
  if [ -n "${WKSP:-}" ]; then
    echo "  WARNING: WKSP was preset to ${WKSP}; resetting for main workspace."
    unset WKSP
  fi
fi
