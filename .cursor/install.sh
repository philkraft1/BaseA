#!/usr/bin/env bash
# Idempotent bootstrap for the Due dev environment.
# Runs after the repository is checked out. Safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."

# 1) Node dependencies for the Next.js app.
npm ci

# 2) Foundry (forge/cast/anvil) for the contracts/ subproject.
if [ ! -x "$HOME/.foundry/bin/foundryup" ]; then
  curl -L https://foundry.paradigm.xyz | bash
fi
export PATH="$HOME/.foundry/bin:$PATH"
foundryup

# Persist Foundry on PATH for terminals and future shells.
if ! grep -q '.foundry/bin' "$HOME/.bashrc" 2>/dev/null; then
  echo 'export PATH="$HOME/.foundry/bin:$PATH"' >> "$HOME/.bashrc"
fi

# 3) Contract dependency (forge-std). Skip if already vendored.
if [ ! -d contracts/lib/forge-std ]; then
  (cd contracts && forge install foundry-rs/forge-std --no-git)
fi
