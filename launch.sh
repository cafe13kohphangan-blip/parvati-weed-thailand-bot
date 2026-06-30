#!/bin/bash
cd "$(dirname "$0")"

export BOT_TOKEN="8284820278:AAGibaELwGgE_lfB0H1yZgUSn32dxqHuXaQ"
export ADMIN_ID="237228075"

echo "🚀 Launching Parvati weed Thailand (Premium Edition)..."
echo "🤖 Token: ${BOT_TOKEN:0:10}..."
echo "👑 Admin: $ADMIN_ID"
echo ""

node bot.js
