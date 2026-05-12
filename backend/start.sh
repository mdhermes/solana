#!/bin/bash
set -e

cd "$(dirname "$0")"

# Source the .env file for non-sensitive config
export $(grep -v '^\s*#' .env | grep -v 'GEMINI_API_KEY\|OPENAI_API_KEY' | xargs)

# Read secrets from pass directly - NEVER echo these
export GEMINI_API_KEY=$(pass show google/mdhermes4/gemini-api-key)
export DODO_API_KEY=$(pass show hermes/dodo/api_key 2>/dev/null || grep DODO_API_KEY .env | cut -d= -f2-)

# OpenAI-compatible endpoint alias for Gemini
export OPENAI_API_KEY="$GEMINI_API_KEY"

# Start the server
exec node dist/index.js
