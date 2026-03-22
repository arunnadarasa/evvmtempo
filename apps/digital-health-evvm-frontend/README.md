# Digital Health EVVM — Frontend

This Vite app lives in the **[evvmtempo](https://github.com/arunnadarasa/evvmtempo)** monorepo at `apps/digital-health-evvm-frontend/`. From the repository root, run `cd apps/digital-health-evvm-frontend` then the commands below.

**GitHub Pages:** deployment is defined at `.github/workflows/deploy-digital-health-evvm-pages.yml` (repository root). The build uses `VITE_BASE_PATH=/evvmtempo/`; change that workflow env if your Pages URL differs.

---

An OpenClaw framework for clinical agentic engineering. This app targets **Tempo Moderato** (chain **42431**) and the principal token symbol from deploy metadata (**JAB** in current `input/BaseInputs.sol`). Contract addresses are in `src/config/contracts.ts`.

## Disclaimer

This is an educational prototype and is not affiliated with or endorsed by any healthcare provider or government body.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Connect a wallet on **Tempo Moderato** and use:

- **EVVM Core** — View principal balance, testnet faucet, transfer
- **Name Service** — Check username availability, pre-register, complete registration (30 min delay)
- **Staking** — Stake and unstake

## Build

```bash
npm run build
npm run preview   # serve dist/
```

## Contracts (Tempo Moderato — EVVM Tempo testnet, 42431)

Addresses below must match your latest **`broadcast/Deploy.s.sol/42431/run-latest.json`** after deploy. Refresh them with `./scripts/print-deploy-addresses.sh` from the repo root, then paste into `src/config/contracts.ts`.

Deploy, **EVVM registry** registration (Ethereum Sepolia), Blockscout **verification**, and syncing **`EVVM_ID`** are documented in root [`DEPLOYMENT-TEMPO-LEARNINGS.md` §8](../../DEPLOYMENT-TEMPO-LEARNINGS.md#8-official-cli-redeploy-registry-verification--frontend-sync).

**EVVM ID:** set in `src/config/contracts.ts` — use **0** until you run `./evvm register …`; then use the ID returned by the registry.

On-chain principal token metadata uses **JAB** (KRUMP / placeholder principal address `0x000…0001` in Core metadata per `BaseInputs.sol`).

- Core (Evvm): `0x7b1bc28d5e07ac5c88fc31d19f86eb96e7e994e9`
- Staking: `0xcbac92c9c1bdaf352b8462653717732679ec9691`
- Estimator: `0x4798ff704b12587311998c1da2bc80fa34126b3b`
- NameService: `0x2c9bace7007efd0b925e0a570c80ea7e4c430fc3`
- Treasury: `0xf03d8d9ace57e0cccc9a4fc8b98f90118ff18e5c`
- P2PSwap: `0xe1ff154833b1c20f0c282095a56810118c80fff8`

**RPC:** `https://rpc.moderato.tempo.xyz` · **Explorer:** [explore.moderato.tempo.xyz](https://explore.moderato.tempo.xyz)
