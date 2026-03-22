#!/usr/bin/env bash
# Print contract names and addresses from a Foundry broadcast JSON (default: Moderato 42431).
# Usage: ./scripts/print-deploy-addresses.sh [path/to/run-latest.json]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JSON="${1:-$ROOT/broadcast/Deploy.s.sol/42431/run-latest.json}"
if [[ ! -f "$JSON" ]]; then
  echo "File not found: $JSON" >&2
  echo "Deploy first; path is usually broadcast/Deploy.s.sol/<chainId>/run-latest.json" >&2
  exit 1
fi
echo "# From $JSON"
jq -r '.transactions[] | select(.contractName != null and .contractAddress != null) | "\(.contractName)\t\(.contractAddress)"' "$JSON" 2>/dev/null \
  | column -t -s $'\t' || jq '.' "$JSON" | head -5
