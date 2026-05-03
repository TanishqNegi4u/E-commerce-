#!/bin/bash
# Run this script once locally to generate the complete package-lock.json.
# After running, commit the lockfile and switch Dockerfile to use npm ci.
set -e
cd "$(dirname "$0")/../frontend-react"
echo "Generating full package-lock.json..."
npm install --legacy-peer-deps
echo ""
echo "Done! Now:"
echo "  1. git add frontend-react/package-lock.json"
echo "  2. git commit -m 'chore: generate full package-lock.json'"
echo "  3. In frontend-react/Dockerfile change npm install to npm ci"