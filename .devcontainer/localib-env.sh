# Sourced by shell profiles in the dev container to provide the LOCALIB_* environment.
#
# - Discogs key/secret come from GitHub Codespaces secrets (LOCALIB_DISCOGS_CONSUMER_KEY and
#   LOCALIB_DISCOGS_CONSUMER_SECRET), which Codespaces injects into the container automatically.
# - The OAuth callback is derived from where the frontend (port 8100) is reachable.
# - Anything non-empty in .devcontainer/devcontainer.env overrides the values worked out here.

__localib_dir="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
__localib_fe_port=8100

if [ -n "${CODESPACE_NAME:-}" ]; then
	__localib_fe_url="https://${CODESPACE_NAME}-${__localib_fe_port}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
elif [ -n "${GITPOD_WORKSPACE_ID:-}" ]; then
	__localib_fe_url="https://${__localib_fe_port}-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}"
else
	__localib_fe_url="http://localhost:${__localib_fe_port}"
fi

export LOCALIB_IMAGE_PATH="${LOCALIB_IMAGE_PATH:-../Images}"
export LOCALIB_DISCOGS_CALLBACK_URL="${LOCALIB_DISCOGS_CALLBACK_URL:-${__localib_fe_url}/callback}"
[ -n "${LOCALIB_DISCOGS_CONSUMER_KEY:-}" ] && export LOCALIB_DISCOGS_CONSUMER_KEY
[ -n "${LOCALIB_DISCOGS_CONSUMER_SECRET:-}" ] && export LOCALIB_DISCOGS_CONSUMER_SECRET

# Optional manual overrides. Empty values are skipped so they don't blank out the defaults above.
if [ -f "${__localib_dir}/devcontainer.env" ]; then
	while IFS='=' read -r __localib_key __localib_value || [ -n "${__localib_key}" ]; do
		case "${__localib_key}" in
			''|\#*) continue ;;
		esac
		__localib_value="${__localib_value%\"}"
		__localib_value="${__localib_value#\"}"
		[ -n "${__localib_value}" ] && export "${__localib_key}=${__localib_value}"
	done < "${__localib_dir}/devcontainer.env"
fi

unset __localib_dir __localib_fe_port __localib_fe_url __localib_key __localib_value
