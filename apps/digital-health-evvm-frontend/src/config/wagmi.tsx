import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { tempo, tempoModerato } from "viem/chains";
import { Addresses } from "viem/tempo";
import { TEMPO_MAINNET_USDC } from "./tempoStablecoins";

const pathUsd = Addresses.pathUsd;
const tempoMainnetFeeToken = TEMPO_MAINNET_USDC.address;

/**
 * viem `sendCallsSync` default timeout = `max(3 * chain.blockTime, 5000)` ms.
 * Tempo’s spec uses ~500ms–1s blocks; the default ~3s wait times out in MetaMask before the bundle lands.
 * This override only stretches the **client wait** — not on-chain block time.
 */
const TEMPO_SEND_CALLS_BLOCKTIME_MS = 30_000;

/** PathUSD fee token — required for Tempo `prepareTransactionRequest` / MPP + wallet sends. */
export const tempoModeratoChain = tempoModerato.extend({
  feeToken: pathUsd,
  blockTime: TEMPO_SEND_CALLS_BLOCKTIME_MS,
});

export const tempoMainnetChain = tempo.extend({
  feeToken: tempoMainnetFeeToken,
  blockTime: TEMPO_SEND_CALLS_BLOCKTIME_MS,
});

export const config = createConfig({
  chains: [tempoModeratoChain, tempoMainnetChain],
  connectors: [injected()],
  transports: {
    [tempoModeratoChain.id]: http("https://rpc.moderato.tempo.xyz"),
    [tempoMainnetChain.id]: http("https://rpc.presto.tempo.xyz"),
  },
});
