#!/bin/bash
set -e

cd "$(dirname "$0")"

# Load env for non-sensitive config
export $(grep -v '^\s*#' .env | grep -v 'GEMINI_API_KEY\|OPENAI_API_KEY' | xargs)

# Read working Gemini key from auth.json credential pool (key2)
export GEMINI_API_KEY=$(python3 -c "
import json
with open('/home/md/.hermes/auth.json') as f:
    data = json.load(f)
for c in data.get('credential_pool', {}).get('gemini', []):
    if c['label'] == 'key2':
        print(c['access_token'])
        break
")

# OpenAI-compatible endpoint alias
export OPENAI_API_KEY="$GEMINI_API_KEY"

# Start server
exec node dist/index.js
