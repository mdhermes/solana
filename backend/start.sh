#!/bin/bash
set -e

cd "$(dirname "$0")"

# Source the .env file for non-sensitive config
export $(grep -v '^\s*#' .env | grep -v 'GEMINI_API_KEY\|OPENAI_API_KEY\|DODO_API_KEY' | xargs)

# Read Gemini key from auth.json credential pool
export GEMINI_API_KEY=$(python3 -c "
import json
with open('/home/md/.hermes/auth.json') as f:
    data = json.load(f)
for c in data.get('credential_pool', {}).get('gemini', []):
    if c['label'] == 'key2':
        print(c['access_token'])
        break
")

# Read Dodo key from .env
export DODO_API_KEY=$(grep DODO_API_KEY .env | cut -d= -f2-)

# OpenAI-compatible endpoint alias for Gemini
export OPENAI_API_KEY="$GEMINI_API_KEY"

# Start the server
exec node dist/index.js
