#!/bin/sh
#
# Helper script to set the WKSP environment variable based on the current
# branch. Any branch name starting with "docsy" is considered a Docsy workspace.
#
# cSpell:ignore docsy wksp RPROMPT

# For Netlify docs on meta vars, see
# https://docs.netlify.com/build/configure-builds/environment-variables/#git-metadata

__docsy_wksp_helper() {
  local script_name="set-docsy-wksp"
  local force_override=false

  __usage() {
    echo "Usage: ${script_name} [-f|--force]"
    echo "  -f|--force: force override of WKSP"
    echo "  -h|--help: show this help message"
  }

  case "${1:-}" in
    '') ;;
    -f|--force)
      force_override=true
      shift
      ;;
    -h|--help)
      __usage
      return 0
      ;;
    *)
      echo "ERROR: unexpected argument: '$1'"
      __usage
      return 1
      ;;
  esac

  echo "${script_name}:"

  if [ -n "${WKSP:-}" ] && [ "$force_override" = false ]; then
    echo "  > WKSP is already set to '${WKSP}', skipping."
    return 0
  fi

  branch="${HEAD:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)}"

  echo "  > branch: $branch"

  WKSP_FOR_DOCSY_ONLY="docsy"
  WKSP_FOR_DOCSY_DEV="dev.yaml,hugo.docsy"

  WKSP_FOR_DOCSY="${WKSP_FOR_DOCSY_ONLY}"
  if [ -z "${NETLIFY:-}" ]; then
    WKSP_FOR_DOCSY="${WKSP_FOR_DOCSY_DEV}"
  fi

  case "$branch" in
    docsy*)
      echo "  Docsy workspace identified."
      export WKSP="${WKSP_FOR_DOCSY}"
      echo "  Setting WKSP to ${WKSP}"
      ;;
    *)
      echo "  Main workspace identified."
      if [ -n "${WKSP:-}" ]; then
        if [ "$force_override" = true ]; then
          echo "  Clearing WKSP for main workspace (forced)."
        else
          echo "  WARNING: WKSP was preset to ${WKSP}; resetting for main workspace."
        fi
        unset WKSP
      fi
      ;;
  esac
}

# Store caller positional parameters so we can restore them after sourcing.
__docsy_wksp_helper "$@"
unset -f __docsy_wksp_helper 2>/dev/null || :
