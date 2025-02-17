#! /bin/env bash
if [ ! -z ${GITPOD_HOST+x} ]; then
	FE_URL="https://5000-${GITPOD_WORKSPACE_ID}.${GITPOD_WORKSPACE_CLUSTER_HOST}"
elif [ ! -z ${CODESPACE_NAME+x} ]; then
	FE_URL="https://${CODESPACE_NAME}-5000.app.github.dev"
else
	FE_URL="http://localhost:5000"
fi

git update-index --assume-unchanged .devcontainer/devcontainer.env
npm run back:deps
npm run front:install
npm run back:restore
npm run back:migrate

echo "VITE_VINYL_API_URL=${FE_URL}" > frontend/.env.local
