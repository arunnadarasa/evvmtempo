/**
 * Tempo Moderato (42431) — EVVM Tempo testnet.
 * Matches `input/BaseInputs.sol` + `broadcast/Deploy.s.sol/42431/run-latest.json`.
 */
export const CHAIN_ID = 42431 as const;

/** Registry ID unset until registered on Ethereum Sepolia; use 0 for signing. */
export const EVVM_ID = 0n;

/** Principal token key in Core `balances` mapping (placeholder address in metadata). */
export const DHM_TOKEN = "0x0000000000000000000000000000000000000001" as `0x${string}`;

/** From `broadcast/Deploy.s.sol/42431/run-latest.json` (latest full deploy). */
export const ADDRESSES = {
  evvm: "0x7b1bc28d5e07ac5c88fc31d19f86eb96e7e994e9",
  staking: "0xcbac92c9c1bdaf352b8462653717732679ec9691",
  nameService: "0x2c9bace7007efd0b925e0a570c80ea7e4c430fc3",
  treasury: "0xf03d8d9ace57e0cccc9a4fc8b98f90118ff18e5c",
  estimator: "0x4798ff704b12587311998c1da2bc80fa34126b3b",
  p2pSwap: "0xe1ff154833b1c20f0c282095a56810118c80fff8",
} as const;

/** On-chain metadata: principalTokenSymbol in BaseInputs.sol (deploy). */
export const TOKEN_SYMBOL = "JAB";

export const NETWORK_DISPLAY_NAME = "Tempo Moderato";

export const TX_EXPLORER_BASE = "https://explore.moderato.tempo.xyz";
