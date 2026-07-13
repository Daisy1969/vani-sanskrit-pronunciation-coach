#!/bin/bash
cd "$(dirname "$0")" || exit 1

PORT="${PORT:-4173}"
while lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done
export PORT

URL="http://localhost:$PORT"
(
  sleep 1.2
  open -a "Google Chrome" "$URL" 2>/dev/null || open "$URL"
) &

echo "Starting Vāṇī Sanskrit Pronunciation Coach on $URL…"
echo "Keep this Terminal window open while using the application."
node server.js
