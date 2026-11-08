#! /bin/env bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -z ${GITPOD_HOST+x} ]; then
	FE_URL="https://5000-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}"
elif [ ! -z ${CODESPACE_NAME+x} ]; then
	FE_URL="https://${CODESPACE_NAME}-5000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
else
	FE_URL="http://localhost:5000"
fi

# Load the LOCALIB_* environment (Codespaces secrets, image path, callback URL) in every shell.
for RC in ~/.bashrc ~/.zshrc; do
	if [ -f "$RC" ] && ! grep -q "localib-env.sh" "$RC"; then
		echo "[ -f \"${SCRIPT_DIR}/localib-env.sh\" ] && . \"${SCRIPT_DIR}/localib-env.sh\"" >> "$RC"
	fi
done

npm run back:deps
npm run front:install
npm run back:restore
npm run back:migrate

echo "VITE_VINYL_API_URL=${FE_URL}" > frontend/.env.local
