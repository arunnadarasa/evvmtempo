# Digital Health EVVM — Frontend

This Vite app lives in the **[evvmtempo](https://github.com/arunnadarasa/evvmtempo)** monorepo at `apps/digital-health-evvm-frontend/`. From the repository root, run `cd apps/digital-health-evvm-frontend` then the commands below.

**GitHub Pages:** deployment is defined at `.github/workflows/deploy-digital-health-evvm-pages.yml` (repository root). The build uses `VITE_BASE_PATH=/evvmtempo/`; change that workflow env if your Pages URL differs.

---

An OpenClaw framework for clinical agentic engineering. This app targets **Tempo Moderato** (chain **42431**) and the **MATE** principal token. Contract addresses are in `src/config/contracts.ts`.

## Disclaimer

This is an educational prototype and is not affiliated with or endorsed by any healthcare provider or government body.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Connect a wallet on **Tempo Moderato** and use:

- **EVVM Core** — View MATE balance, testnet faucet, transfer
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

On-chain principal token metadata uses **MATE** (placeholder principal address `0x000…0001` in Core metadata).

- Core (Evvm): `0xd43072d851e15cd96d54374b95f2c5ea91ff959c`
- Staking: `0xd75d635b61925574e4d43f82daffd002a37b3197`
- Estimator: `0x0c941b85519d95552cccf1a2f1d0bd6905093733`
- NameService: `0xcd2d3b3cb5cc5997dbdc8677418d97d70bddeee0`
- Treasury: `0x5dd43e0543939bc4987e066dee73dda77a8e0b5f`
- P2PSwap: `0x0979328cb08ae6ba375b8f31c9dd6d23db041eb0`

**RPC:** `https://rpc.moderato.tempo.xyz` · **Explorer:** [explore.moderato.tempo.xyz](https://explore.moderato.tempo.xyz)
