# Digital Health EVVM — Frontend

This Vite app lives in the **[evvmtempo](https://github.com/arunnadarasa/evvmtempo)** monorepo at `apps/digital-health-evvm-frontend/`. From the repository root, run `cd apps/digital-health-evvm-frontend` then the commands below.

**GitHub Pages:** deployment is defined at `.github/workflows/deploy-digital-health-evvm-pages.yml` (repository root). The build uses `VITE_BASE_PATH=/evvmtempo/`; change that workflow env if your Pages URL differs.

---

An OpenClaw framework for clinical agentic engineering. This app connects to your **Digital Health EVVM** on **Base Sepolia** (EVVM ID: 1143) or **Tempo Moderato** (see `src/config/contracts.ts` and `.env.example`) and uses the **Digital Health MATE (DHM)** / **MATE** token depending on target network.

## Disclaimer

This is an educational prototype and is not affiliated with or endorsed by any healthcare provider or government body.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Set `VITE_TARGET_NETWORK` in `.env` (`tempo-moderato` or `base-sepolia`; default is Tempo Moderato). Connect a wallet on the matching chain and use:

- **EVVM Core** — View principal token balance (DHM or MATE), faucet, transfer
- **Name Service** — Check username availability, pre-register, complete registration (30 min delay)
- **Staking** — Stake and unstake

## Build

```bash
npm run build
npm run preview   # serve dist/
```

## Contracts (Base Sepolia, 84532)

EVVM ID **1143**. Principal token label **DHM**.

- Core: `0xfE6Ad61c4d93366c79a1406bfE8838A11cF53734`
- Staking: `0x69033E3912C62911846Dc18CB7cFf832FF1b8065`
- NameService: `0x72b01f41883C933db8CB69c60ed4a36fe5fb4A11`
- Treasury: `0x81250D5e3fAbc8811c181B32A293144Cd4459b1b`
- P2PSwap: `0xE72634662FCD079DBdf9561f715ff5099EDE2B88`

## Contracts (Tempo Moderato — EVVM Tempo testnet, 42431)

Deployed from this repo’s Foundry stack (`script/Deploy.s.sol`); see root [`DEPLOYMENT-TEMPO-LEARNINGS.md`](../../DEPLOYMENT-TEMPO-LEARNINGS.md). EVVM ID **0** (signing) until registered on Sepolia. On-chain principal token metadata uses **MATE** (placeholder principal address `0x000…0001` in Core metadata).

- Core (Evvm): `0xd43072d851e15cd96d54374b95f2c5ea91ff959c`
- Staking: `0xd75d635b61925574e4d43f82daffd002a37b3197`
- Estimator: `0x0c941b85519d95552cccf1a2f1d0bd6905093733`
- NameService: `0xcd2d3b3cb5cc5997dbdc8677418d97d70bddeee0`
- Treasury: `0x5dd43e0543939bc4987e066dee73dda77a8e0b5f`
- P2PSwap: `0x0979328cb08ae6ba375b8f31c9dd6d23db041eb0`

**RPC:** `https://rpc.moderato.tempo.xyz` · **Explorer:** [explore.moderato.tempo.xyz](https://explore.moderato.tempo.xyz)
