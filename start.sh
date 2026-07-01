#!/bin/bash
cd "$(dirname "$0")"

# Extract token from SEKRETY
BOT_TOKEN=$(grep -oE '[0-9]{10}:[A-Za-z0-9_-]+' ~/.openclaw/workspace/SEKRETY.md | head -1)
export BOT_TOKEN
export ADMIN_ID=237228075

exec node bot_v2.js 2>&1
