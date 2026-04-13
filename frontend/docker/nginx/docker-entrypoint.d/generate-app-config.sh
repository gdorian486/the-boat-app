#!/bin/sh
set -eu

: "${KEYCLOAK_URL:=http://localhost:8081}"
: "${KEYCLOAK_REALM:=boat}"
: "${KEYCLOAK_CLIENT_ID:=boat-api}"
: "${API_BASE_URL:=http://localhost:8080}"

envsubst '${KEYCLOAK_URL} ${KEYCLOAK_REALM} ${KEYCLOAK_CLIENT_ID} ${API_BASE_URL}' \
  < /usr/share/nginx/html/app-config.template.json \
  > /usr/share/nginx/html/app-config.json
