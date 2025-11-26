#!/bin/sh

# Generate env-config.js from environment variables at runtime
cat <<EOF > /app/dist/env-config.js
window.ENV = {
  API_BASE_URL: "${API_BASE_URL:-http://localhost:8000}"
};
EOF

# Start the server
exec serve -s dist -l 3000
