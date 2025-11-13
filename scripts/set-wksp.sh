#!/bin/sh
#
# Helper script to set the WKSP environment variable used by the Hugo wrapper.
# Locally we append the development overlay, while production (Netlify) builds
# stick to the main configuration.
#
# cSpell:ignore wksp bulma

# For Netlify docs on meta vars, see
# https://docs.netlify.com/build/configure-builds/environment-variables/#git-metadata

__set_wksp_helper() {
  __local_force_override=false
  __local_script_name='set-wksp.sh'

  __usage() {
    echo "Usage: ${__local_script_name} [-f|--force]"
    echo "  -f|--force: force override of WKSP"
    echo "  -h|--help: show this help message"
  }

  __local_first_arg="${1:-}"

  if [ "$#" -gt 1 ]; then
    shift
    echo "WARNING: ignoring additional arguments: $*"
  fi

  case "$__local_first_arg" in
    '') ;;
    -f|--force)
      __local_force_override=true
      ;;
    -h|--help)
      __usage
      unset __local_force_override __local_first_arg __local_script_name
      return 0
      ;;
    *)
      echo "ERROR: unexpected argument: '$__local_first_arg'"
      __usage
      unset __local_force_override __local_first_arg __local_script_name
      return 1
      ;;
  esac

  echo "set-wksp.sh:"
  echo "  > NETLIFY: '${NETLIFY}'"
  echo "  > WKSP: '${WKSP}' - current value"

  if [ -n "${WKSP:-}" ] && [ "$__local_force_override" = false ]; then
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

  wksp_value=''
  wksp_dev_overlay='hugo.dev.yaml'

  case "$branch" in
    legacy*|bulma*|pre-docsy*)
      echo "  Legacy branch detected. Using base configuration only."
      ;;
    *)
      if [ -n "${NETLIFY:-}" ]; then
        echo "  NETLIFY build detected; using production configuration."
      else
        echo "  Using development overlay (${wksp_dev_overlay})."
        wksp_value="${wksp_dev_overlay}"
      fi
      ;;
  esac

  if [ -n "${wksp_value}" ]; then
    export WKSP="${wksp_value}"
  else
    unset WKSP
  fi

  echo "  > WKSP: ${WKSP}"

  unset __local_force_override __local_first_arg __local_script_name wksp_value wksp_dev_overlay branch
}

# Store caller positional parameters so we can restore them after sourcing.
__set_wksp_helper "$@"
unset -f __set_wksp_helper 2>/dev/null || :
