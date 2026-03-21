/**
 * Tempo Moderato (42431) — EVVM Tempo testnet.
 * Matches `input/BaseInputs.sol` EvvmMetadata + `script/Deploy.s.sol` broadcast (chain 42431).
 */
export const CHAIN_ID = 42431 as const;

/** Registry ID unset until registered on Ethereum Sepolia; use 0 for signing. */
export const EVVM_ID = 0n;

/** Principal token key in Core `balances` mapping (placeholder address in metadata). */
export const DHM_TOKEN = "0x0000000000000000000000000000000000000001" as `0x${string}`;

export const ADDRESSES = {
  evvm: "0xd43072d851e15cd96d54374b95f2c5ea91ff959c",
  staking: "0xd75d635b61925574e4d43f82daffd002a37b3197",
  nameService: "0xcd2d3b3cb5cc5997dbdc8677418d97d70bddeee0",
  treasury: "0x5dd43e0543939bc4987e066dee73dda77a8e0b5f",
  estimator: "0x0c941b85519d95552cccf1a2f1d0bd6905093733",
  p2pSwap: "0x0979328cb08ae6ba375b8f31c9dd6d23db041eb0",
} as const;

/** On-chain metadata uses Mate Token / MATE (see BaseInputs.sol). */
export const TOKEN_SYMBOL = "MATE";

export const NETWORK_DISPLAY_NAME = "Tempo Moderato";

export const TX_EXPLORER_BASE = "https://explore.moderato.tempo.xyz";
