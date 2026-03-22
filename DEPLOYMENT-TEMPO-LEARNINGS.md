# EVVM on Tempo (Moderato): Full Deployment Learnings

This document records what we learned deploying an EVVM-style stack on **Tempo Moderato** (chain ID **42431**, RPC `https://rpc.moderato.tempo.xyz`): what worked, what failed, how we fixed it, and how to operate safely next time.

---

## 1. What we were trying to build

An **EVVM instance** on a host chain is a coordinated set of contracts. In this repository, the canonical single-chain deploy (`script/Deploy.s.sol`) deploys **six** contracts in one broadcast session (order matters for wiring):

| Order | Contract    | Role (short)                                      |
|------|-------------|---------------------------------------------------|
| 1     | `Staking`   | Staking layer; wired later to Estimator + Core   |
| 2     | `Core`      | Core EVVM logic (often referred to as “Evvm”)    |
| 3     | `Estimator` | Staking-related estimator                        |
| 4     | `NameService` | Name service tied to Core                       |
| —     | (calls)     | `staking.initializeSystemContracts(estimator, core)` |
| 5     | `Treasury`  | Treasury for Core                                 |
| —     | (calls)     | `core.initializeSystemContracts(nameService, treasury)` |
| 6     | `P2PSwap`   | P2P swap (large contract; last to deploy)         |

**Previously optional; now supported for Tempo Moderato:**

- **EVVM registry (Ethereum Sepolia)** — chain ID **42431** is whitelisted on the registry (`isChainIdRegistered(42431)` returns true). After deploy, run `evvm register --coreAddress <Core> --walletName <account>` (same admin wallet as deploy). See [§8](#8-official-cli-redeploy-registry-verification--frontend-sync).
- **Block explorer verification** — use **Blockscout** mode in the CLI (or `EVVM_SKIP_EXPLORER_VERIFY=1` to skip). Tempo hosts explorers such as [explore.moderato.tempo.xyz](https://explore.moderato.tempo.xyz) and [explore.testnet.tempo.xyz](https://explore.testnet.tempo.xyz); use the matching **/api/** base for `--verifier-url` if Forge asks.

---

## 2. Network facts that drive most of the pain (Tempo / TIP-1000)

- **Gas is paid in USD stablecoins** (not a “native ETH” mental model). On **Tempo Moderato testnet (42431)** the usual fee tokens are **PathUSD**, **AlphaUSD**, **BetaUSD**, and **ThetaUSD** (all **6 decimals**). Addresses (check `viem/tempo` for PathUSD — `Addresses.pathUsd`):
  - **PathUSD** — `0x20c0000000000000000000000000000000000000`
  - **AlphaUSD** — `0x20c0000000000000000000000000000000000001`
  - **BetaUSD** — `0x20c0000000000000000000000000000000000002`
  - **ThetaUSD** — `0x20c0000000000000000000000000000000000003`  
  The public testnet **faucet often funds all four** so you can pay fees with whichever token your wallet selects.

  **Note:** In `input/BaseInputs.sol`, `principalTokenAddress` is a **placeholder** (`0x000…0001`). For a production-aligned principal token on Moderato, set it to a real TIP-20 address (e.g. **AlphaUSD** at `0x20c0000000000000000000000000000000000001`) if your economics should track that stablecoin.
- **State creation is expensive** on Tempo relative to mainnet-style assumptions: contract-creation cost per byte is much higher than Ethereum’s ~200 gas/byte (documentation cites ~1000 gas/byte-class behavior).
- **Per-transaction gas cap** is on the order of **30M gas** — large deployments must fit under that per tx.
- **Foundry’s default gas estimate multiplier (~130%) is often wrong here** for big `CREATE` transactions: you see errors like **“intrinsic gas too low”** when the signed tx carries too little gas.

These facts are why we bumped multipliers, block gas limits, and slow broadcast.

---

## 3. Successes

### 3.1 Full stack deploy via `Deploy.s.sol`

A complete run of `forge script script/Deploy.s.sol:DeployScript … --broadcast` produced on-chain deployments for **Staking, Core, Estimator, NameService, Treasury, and P2PSwap**, with addresses recorded under:

`broadcast/Deploy.s.sol/42431/run-latest.json`

Example addresses from that artifact (verify on-chain before treating as canonical for production):

- Staking: `0xd75d635b61925574e4d43f82daffd002a37b3197`
- Core: `0xd43072d851e15cd96d54374b95f2c5ea91ff959c`
- Estimator: `0x0c941b85519d95552cccf1a2f1d0bd6905093733`
- NameService: `0xcd2d3b3cb5cc5997dbdc8677418d97d70bddeee0`
- Treasury: `0x5dd43e0543939bc4987e066dee73dda77a8e0b5f`
- P2PSwap: `0x0979328cb08ae6ba375b8f31c9dd6d23db041eb0`

Always re-read your **own** `run-latest.json` if you redeploy.

### 3.2 CLI defaults for Moderato (chain 42431)

To reduce foot-guns, the EVVM CLI deployment path was adjusted so that on **42431**:

- If `EVVM_GAS_ESTIMATE_MULTIPLIER` is unset, it defaults to **400** (users often need **800–1000** for the largest creates).
- `EVVM_BROADCAST_SLOW` defaults to **1** so Forge uses **`--slow`** unless explicitly disabled — helps with nonce ordering on congested or quirky RPCs.

See: `cli/commands/deploy/deploySingle.ts`, `cli/utils/foundry.ts`.

### 3.3 Two-phase recovery: deploy only `P2PSwap`

When the **last** contract in the full script failed (historically `P2PSwap` due to size/gas), we added:

- `script/DeployP2PSwapOnly.s.sol` — deploys **only** `P2PSwap` with constructor args from env vars.
- `scripts/print-p2pswap-env.sh` — extracts Core + Staking addresses from a Foundry broadcast JSON and prints `export` lines for `eval`.

This avoids redeploying the entire stack when Core + Staking already exist.

### 3.4 Documentation in `.env.example`

Environment patterns were documented: RPC URL, skip flags, gas multiplier, block gas limit, slow broadcast, clearing stale `broadcast/` / `cache/`, and paste-safe `export` syntax for zsh (avoid comments on the same line as `export`).

---

## 4. Failures, symptoms, and fixes

### 4.1 `intrinsic gas too low`

- **Symptom:** Forge or RPC rejects the tx before/without meaningful execution.
- **Cause:** Gas limit attached to the transaction too low vs Tempo’s high intrinsic / creation costs.
- **Fix:** Raise `EVVM_GAS_ESTIMATE_MULTIPLIER` (often **800**, sometimes **1000**). Use `--block-gas-limit 30000000` in line with the network cap. Retry after a clean simulation.

### 4.2 `nonce too low` / `replacement transaction underpriced`

- **Symptom:** Later txs in a multi-tx script fail; nonces out of sync.
- **Cause:** Stale **Foundry broadcast** or **cache** state locally, or RPC returning inconsistent pending nonces when sending bursts.
- **Fix:** Enable **`--slow`** (via `EVVM_BROADCAST_SLOW=1`). If still broken, remove chain-specific artifacts, e.g.  
  `rm -rf broadcast/Deploy.s.sol/42431 cache/Deploy.s.sol/42431`  
  then redeploy **carefully** (understand this deletes local broadcast history for that script/chain).

### 4.3 Generic `Transaction Failure` on a large `CREATE` (e.g. P2PSwap)

- **Symptom:** On-chain revert or failure at the last deployment step.
- **Likely contributors:** Still-too-low gas after estimate, insufficient fee token balance, or hitting per-tx gas limits.
- **Mitigations:** Higher multiplier, ensure enough PathUSD (or whatever pays gas), `--slow`, and if needed **split** deployment using `DeployP2PSwapOnly.s.sol`.

### 4.4 Shell / env mistakes

| Mistake | What goes wrong | Fix |
|--------|------------------|-----|
| `export FOO=800 # or 1000` copied literally | zsh may parse `or` / `1000` as bad `export` syntax | One variable per line; separate comment lines |
| Placeholder addresses in `.env` | `vm.envAddress` / script parsing fails | Use full **42-character** `0x` + 40 hex digits |
| Printing helper output without `eval` | Variables not set in current shell | `eval "$(./scripts/print-p2pswap-env.sh)"` |

### 4.5 Stricter address parsing in `DeployP2PSwapOnly`

`DeployP2PSwapOnly.s.sol` uses explicit validation so opaque Forge errors become actionable (length, `0x` prefix, no placeholder strings).

### 4.6 Foundry JSON vs reality (P2PSwap-only run)

In at least one `DeployP2PSwapOnly` broadcast, metadata showed a **`contractAddress` that matched the Staking address passed as a constructor argument** — which would be impossible if Staking already held code at that address (a second `CREATE` cannot occupy the same address). **Treat console logs and on-chain checks as ground truth:** `cast code <address>`, receipt from a block explorer, or the **full** `Deploy.s.sol` artifact where P2PSwap has its own distinct address.

**Practical rule:** Prefer the **full deploy** `run-latest.json` for the six-contract instance; double-check any standalone P2PSwap tx against chain state.

### 4.7 Public RPC: `eth_call` / `eth_getCode` vs successful txs to Core (dapps)

On **Tempo Moderato**, the public RPC (`https://rpc.moderato.tempo.xyz`) may return **empty `eth_getCode`** and **empty `eth_call` return data** for a deployed **Core** address, while **transactions** to the same address (for example `addBalance`) **succeed** and appear correctly on the explorer.

**Symptoms for frontends / tooling:**

- `eth_call` for view functions such as `getBalance`, `getNextCurrentSyncNonce`, or `getEvvmMetadata` can yield **no return data**, so libraries like viem/wagmi report **no data** for `readContract` (UI shows missing balance or nonce).
- Writes still **confirm** on-chain.

This is consistent with broader Tempo testnet behavior around how deployment addresses and RPC surfacing interact; see discussion in the Tempo project (for example [tempoxyz/tempo#1550](https://github.com/tempoxyz/tempo/issues/1550) on contract address handling affecting reads).

**Mitigations for apps:**

- Prefer **transaction receipts** and **explorer** confirmation for user-visible success until reads are reliable.
- Optionally maintain **optimistic** balances after known successful operations, or use an **indexer** / **different RPC** if one exposes consistent static calls for your Core address.
- Re-verify **Core** and other contract addresses against your own `broadcast/…/run-latest.json` and on-chain explorers before relying on static calls.
- A **Digital Health EVVM** demo UI ships in this repo under **`apps/digital-health-evvm-frontend/`** (see root `README.md`).

---

## 5. Operational checklist (Moderato)

1. **Fund** the deployer with enough **fee token** (PathUSD-style) for many large txs.
2. **Set** `RPC_URL=https://rpc.moderato.tempo.xyz` (or your provider).
3. **Set** `EVVM_GAS_ESTIMATE_MULTIPLIER` to **800** (or **1000** if needed).
4. **Set** `EVVM_BLOCK_GAS_LIMIT=30000000` if your tooling respects it.
5. **Enable slow broadcast** (`EVVM_BROADCAST_SLOW=1` or CLI default on 42431).
6. **Full deploy:**  
   `forge script script/Deploy.s.sol:DeployScript --via-ir --optimize true --rpc-url "$RPC_URL" --account <name> --broadcast -vvvv`  
   plus gas / block limit / slow flags as documented in `.env.example`.
7. **If** only P2PSwap is missing:  
   `eval "$(./scripts/print-p2pswap-env.sh)"` then run `DeployP2PSwapOnly` with the same Forge flags.
8. **Register** on the Ethereum Sepolia EVVM registry (after deploy): `evvm register --coreAddress <Core from broadcast> --walletName <same as deploy>`. Requires **Sepolia ETH** on that wallet for registry txs. See [§8](#8-official-cli-redeploy-registry-verification--frontend-sync).
9. **Archive** addresses from `run-latest.json` and sync `apps/digital-health-evvm-frontend/src/config/contracts.ts` (see `scripts/print-deploy-addresses.sh`).

---

## 6. Key files reference

| File | Purpose |
|------|---------|
| `script/Deploy.s.sol` | Full six-contract deployment |
| `script/DeployP2PSwapOnly.s.sol` | P2PSwap-only follow-up |
| `scripts/print-p2pswap-env.sh` | Env exports for P2PSwap-only from broadcast JSON |
| `.env.example` | RPC, gas, slow mode, cache clearing, examples |
| `cli/commands/deploy/deploySingle.ts` | Moderato-specific default env for gas + slow |
| `cli/utils/foundry.ts` | Passes multiplier and `--slow` into Forge |
| `broadcast/Deploy.s.sol/42431/run-latest.json` | Full deploy receipts (per machine / run) |
| `apps/digital-health-evvm-frontend/` | Digital Health EVVM demo (Vite + wagmi) |
| `scripts/print-deploy-addresses.sh` | Print contract names/addresses from a `run-latest.json` |

---

## 7. References (external)

- EVVM concepts and CLI: [evvm.info LLM-oriented docs](https://www.evvm.info/llms-full.txt)
- Tempo architecture, fees, gas, TIP-1000: [docs.tempo.xyz LLM-oriented docs](https://docs.tempo.xyz/llms-full.txt)

---

## 8. Official CLI: redeploy, registry, verification, frontend sync

Run these **on your machine** in a normal terminal (not headless CI): `cast` needs access to your imported account (`cast wallet import …`).

### 8.1 Prerequisites

- **Foundry**, **Bun**, `./evvm install` (or `bun install` + `forge install`).
- **Wallet**: `cast wallet import defaultKey --interactive` (or another name; pass `-n` / `--walletName` to commands).
- **Tempo fee tokens**: fund the deployer on **42431** with PathUSD (or another fee token your wallet uses) for many large txs.
- **Ethereum Sepolia ETH**: needed on the **same admin address** for **registry** transactions (not for Tempo deploy).

### 8.2 Environment

```bash
cp .env.example .env
# Set:
#   RPC_URL=https://rpc.moderato.tempo.xyz
# Optional first-time deploy without explorer API:
#   EVVM_SKIP_EXPLORER_VERIFY=1
# Optional: skip in-flow registry prompt and register manually after:
#   EVVM_SKIP_REGISTRY_REGISTRATION=1
```

If redeploying cleanly, clear stale Foundry state for that chain:

```bash
rm -rf broadcast/Deploy.s.sol/42431 cache/Deploy.s.sol/42431
```

### 8.3 Deploy (official TUI or flags)

**Interactive menu:**

```bash
chmod +x ./evvm
./evvm
# → Deploy EVVM Contracts → Single-Chain Deployment
```

**Non-interactive** (uses `input/BaseInputs.sol`):

```bash
./evvm deploy --skipInputConfig --walletName defaultKey
# short: ./evvm deploy -s -n defaultKey
```

Ensure `RPC_URL` points at Moderato when you run this (see `.env`).

### 8.4 Register in EVVM registry

After deploy, read **Core** from the broadcast file or CLI output, then:

```bash
./evvm register --coreAddress 0xYourCoreAddress --walletName defaultKey
```

If the CLI prompts for **custom Ethereum Sepolia RPC**, you can pass `--useCustomEthRpc` and set `EVVM_REGISTRATION_RPC_URL` in `.env` per CLI docs. On success you get an **EVVM ID**; the CLI calls `setEvvmID` on Core on Tempo.

Update the **Digital Health frontend** `EVVM_ID` in `apps/digital-health-evvm-frontend/src/config/contracts.ts` to the new ID (bigint).

### 8.5 Verify on Tempo (Blockscout)

Re-deploy with verification enabled **or** verify in a follow-up Forge run. In the deploy wizard, choose **Blockscout** and set the homepage to your explorer (examples):

- `https://explore.moderato.tempo.xyz`
- `https://explore.testnet.tempo.xyz`

The CLI passes `--verifier blockscout --verifier-url <homepage>/api/` to Forge. If you have no API key, `EVVM_SKIP_EXPLORER_VERIFY=1` is still valid.

### 8.6 Sync frontend contract addresses

```bash
chmod +x ./scripts/print-deploy-addresses.sh
./scripts/print-deploy-addresses.sh
```

Copy **Core**, **Staking**, **NameService**, **Treasury**, **Estimator**, **P2PSwap** into `apps/digital-health-evvm-frontend/src/config/contracts.ts` (`ADDRESSES`).

### 8.7 Explorer “No transactions” on some contracts

A contract page can look empty if the explorer index lags, or if you opened a **child** contract that only receives **internal** calls. **Deployment** txs appear on the **deployer** address and in `run-latest.json`. Compare **contract address** to `broadcast/…/run-latest.json`; use the explorer URL that matches your RPC (Moderato vs testnet hostname).

---

## 9. Summary

Deploying EVVM on **Tempo Moderato** is workable but **not** “Ethereum defaults”: **gas estimation, serialization of txs, and clearing stale Forge state** matter as much as Solidity. We **succeeded** in getting a **full six-contract** instance recorded in Foundry artifacts and added **recovery tooling** for the heaviest contract. The main **failures** were **under-gassed txs**, **nonce/broadcast drift**, and **shell/env hygiene** — all addressable with the checklist above and the scripts in this repo.
