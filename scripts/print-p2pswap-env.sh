#!/usr/bin/env bash
# Print export lines for DeployP2PSwapOnly from a Foundry broadcast file.
# Usage:
#   ./scripts/print-p2pswap-env.sh
#   ./scripts/print-p2pswap-env.sh path/to/run-latest.json [OWNER_ADDRESS]
#
# Default broadcast path matches single-chain deploy on Tempo (chain 42431).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BROADCAST="${1:-$ROOT/broadcast/Deploy.s.sol/42431/run-latest.json}"
OWNER="${2:-0xD113b6ea59E940c7C7F2824aA82E7c212a56FaEA}"

if [[ ! -f "$BROADCAST" ]]; then
  echo "File not found: $BROADCAST" >&2
  echo "Deploy the stack once (or point to the run JSON that contains Core + Staking)." >&2
  exit 1
fi

python3 - "$BROADCAST" "$OWNER" <<'PY'
import json, sys

path, owner = sys.argv[1], sys.argv[2]
with open(path) as f:
    data = json.load(f)

want = {"Core", "Staking"}
found = {}
for tx in data.get("transactions", []):
    name = tx.get("contractName")
    if name in want:
        addr = tx.get("contractAddress")
        if addr:
            found[name] = addr

missing = want - set(found.keys())
if missing:
    print("Could not find contractAddress for:", ", ".join(sorted(missing)), file=sys.stderr)
    print("Open the JSON and locate Staking/Core CREATE transactions.", file=sys.stderr)
    sys.exit(1)

for n in ("Core", "Staking"):
    print(f'export EVVM_P2PSWAP_{n.upper()}={found[n]}')
print(f"export EVVM_P2PSWAP_OWNER={owner}")
PY

# Hints on stderr only so stdout stays pure shell (safe for eval).
{
  echo ""
  echo "Load these into your current shell (required — printing alone does not set env vars):"
  echo "  eval \"\$(./scripts/print-p2pswap-env.sh)\""
  echo ""
  echo "Then deploy P2PSwap (from repo root), e.g.:"
  echo "  export RPC_URL=https://rpc.moderato.tempo.xyz"
  echo "  export EVVM_GAS_ESTIMATE_MULTIPLIER=700"
  echo "  forge script script/DeployP2PSwapOnly.s.sol:DeployP2PSwapOnlyScript \\"
  echo "    --via-ir --optimize true --rpc-url \"\$RPC_URL\" --account defaultKey --broadcast -vvvv \\"
  echo "    --gas-estimate-multiplier \"\${EVVM_GAS_ESTIMATE_MULTIPLIER:-700}\" \\"
  echo "    --block-gas-limit \"\${EVVM_BLOCK_GAS_LIMIT:-30000000}\" --slow"
} >&2
