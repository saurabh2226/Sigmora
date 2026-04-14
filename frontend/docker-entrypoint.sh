#!/bin/sh
set -eu

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

API_URL_ESCAPED=$(escape_js "${VITE_API_URL:-http://localhost/api/v1}")
RAZORPAY_KEY_ESCAPED=$(escape_js "${VITE_RAZORPAY_KEY_ID:-rzp_test_demo}")
GOOGLE_MAPS_KEY_ESCAPED=$(escape_js "${VITE_GOOGLE_MAPS_KEY:-demo}")

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__SIGMORA_CONFIG__ = Object.freeze({
  VITE_API_URL: "${API_URL_ESCAPED}",
  VITE_RAZORPAY_KEY_ID: "${RAZORPAY_KEY_ESCAPED}",
  VITE_GOOGLE_MAPS_KEY: "${GOOGLE_MAPS_KEY_ESCAPED}"
});
EOF
