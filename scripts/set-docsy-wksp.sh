#!/bin/sh
#
# Helper script to set the WKSP environment variable based on the current
# branch. Any branch is considered a Docsy workspace, unless is starts with
# "legacy", "bulma", or "pre-docsy", in which case the workspace is set to
# "pre-docsy".
#
# cSpell:ignore docsy wksp bulma

# For Netlify docs on meta vars, see
# https://docs.netlify.com/build/configure-builds/environment-variables/#git-metadata

__docsy_wksp_helper() {
  __sdw_local_force_override=false

  __usage() {
    echo "Usage: ${__sdw_local_script_name} [-f|--force]"
    echo "  -f|--force: force override of WKSP"
    echo "  -h|--help: show this help message"
  }

  __sdw_local_first_arg="${1:-}"

  if [ "$#" -gt 1 ]; then
    shift
    echo "WARNING: ignoring additional arguments: $*"
  fi

  case "$__sdw_local_first_arg" in
    '') ;;
    -f|--force)
      __sdw_local_force_override=true
      ;;
    -h|--help)
      __usage
      unset __sdw_local_force_override __sdw_local_first_arg
      return 0
      ;;
    *)
      echo "ERROR: unexpected argument: '$__sdw_local_first_arg'"
      __usage
      unset __sdw_local_force_override __sdw_local_first_arg
      return 1
      ;;
  esac

  echo "set-docsy-wksp.sh:"
  echo "  > NETLIFY: '${NETLIFY}'"
  echo "  > WKSP: '${WKSP}' - current value"

  if [ -n "${WKSP:-}" ] && [ "$__sdw_local_force_override" = false ]; then
    if [ -n "${NETLIFY:-}" ]; then
      echo "  > WARNING: WKSP is set to '${WKSP}' in NETLIFY environment. Ignoring current value."
      unset WKSP
    else
      echo "  > WKSP is set to '${WKSP}' in non-NETLIFY environment. Using current value."
      return 0
    fi
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
    legacy*|bulma*|pre-docsy*)
      echo "  Legacy workspace identified."
      if [ -n "${WKSP:-}" ]; then
        if [ "$__sdw_local_force_override" = true ]; then
          echo "  Clearing WKSP for legacy workspace (forced)."
        else
          echo "  Clearing WKSP for legacy workspace."
        fi
      fi
      unset WKSP
      ;;
    docsy*)
      echo "  Docsy workspace identified."
      export WKSP="${WKSP_FOR_DOCSY}"
      echo "  WKSP=${WKSP}"
      ;;
    *)
      echo "  Defaulting to Docsy workspace."
      if [ -n "${WKSP:-}" ]; then
        if [ "$__sdw_local_force_override" = true ]; then
          echo "  Clearing WKSP for main workspace (forced)."
        else
          echo "  WARNING: WKSP was preset to ${WKSP}; resetting for default workspace."
        fi
        unset WKSP
      fi
      export WKSP="${WKSP_FOR_DOCSY}"
      echo "  WKSP=${WKSP}"
      ;;
  esac

  echo "  > WKSP: ${WKSP}"

  unset __sdw_local_script_name __sdw_local_force_override __sdw_local_first_arg
}

# Store caller positional parameters so we can restore them after sourcing.
__docsy_wksp_helper "$@"
unset -f __docsy_wksp_helper 2>/dev/null || :
