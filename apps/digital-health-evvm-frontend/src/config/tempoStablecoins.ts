import { Addresses } from "viem/tempo";

/**
 * Tempo **Moderato** testnet (chain `42431`) — USD-denominated **fee tokens** (6 decimals).
 * Gas is not paid in ETH; wallets use one of these stablecoins (often PathUSD by default).
 *
 * PathUSD address matches `viem/tempo` (`Addresses.pathUsd`). Alpha/Beta/Theta match the Tempo testnet
 * faucet bundle (faucet typically funds all four).
 */
export const TEMPO_MODERATO_FEE_TOKENS = [
  { name: "PathUSD", symbol: "PathUSD", address: Addresses.pathUsd as `0x${string}` },
  { name: "AlphaUSD", symbol: "AlphaUSD", address: "0x20c0000000000000000000000000000000000001" as const },
  { name: "BetaUSD", symbol: "BetaUSD", address: "0x20c0000000000000000000000000000000000002" as const },
  { name: "ThetaUSD", symbol: "ThetaUSD", address: "0x20c0000000000000000000000000000000000003" as const },
] as const;

export const TEMPO_MODERATO_FEE_DECIMALS = 6 as const;

/**
 * Tempo **Mainnet** (chain `4217`) — USDC used for fees / `prepareTransactionRequest` in this app.
 */
export const TEMPO_MAINNET_USDC = {
  symbol: "USDC",
  address: "0x20C000000000000000000000b9537d11c60E8b50" as `0x${string}`,
  decimals: 6 as const,
} as const;
