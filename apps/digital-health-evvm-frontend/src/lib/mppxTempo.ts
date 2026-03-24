import { Mppx, tempo } from "mppx/client";
import { getConnectorClient } from "wagmi/actions";
import { config } from "../config/wagmi";

/** Browser MPP client with Tempo `charge` — PathUSD on Moderato (42431), USDC on mainnet (4217) per wagmi chain `feeToken`. */
export function createTempoMppx() {
  return Mppx.create({
    polyfill: false,
    methods: [
      tempo({
        /**
         * `push` uses `wallet_sendCalls` + `sendCallsSync` (works with MetaMask). `pull` uses `eth_signTransaction`,
         * which many injected wallets block — use push only.
         * Long waits: extend `blockTime` on Wagmi chains so viem’s default `sendCallsSync` timeout is `max(3 * blockTime, 5s)`.
         */
        mode: "push",
        getClient: async ({ chainId }) => {
          const id = chainId ?? 42431;
          if (id !== 4217 && id !== 42431) {
            throw new Error(`Unsupported Tempo chain ${id} (expected 4217 or 42431)`);
          }
          return getConnectorClient(config, { chainId: id });
        },
      }),
    ],
  });
}
