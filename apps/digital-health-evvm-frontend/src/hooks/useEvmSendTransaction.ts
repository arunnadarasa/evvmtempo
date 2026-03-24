import { useCallback } from "react";
import { useWalletClient, usePublicClient } from "wagmi";

/** TIP-1010: normal contract calls should stay well under 16M gas; caps bad estimates & wallet “gas too high” errors. */
const MAX_TX_GAS = 16_000_000n;
const ESTIMATE_BUFFER_NUM = 120n;
const ESTIMATE_BUFFER_DEN = 100n;
const FALLBACK_CONTRACT_GAS = 900_000n;

interface SendTxParams {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

export function useEvmSendTransaction() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const sendTransaction = useCallback(
    async (params: SendTxParams): Promise<`0x${string}`> => {
      if (!walletClient) throw new Error("Wallet not connected");

      let gas: bigint | undefined;
      if (publicClient && walletClient.account && walletClient.chain) {
        try {
          const estimated = await publicClient.estimateGas({
            account: walletClient.account,
            to: params.to,
            data: params.data,
            value: params.value ?? 0n,
          });
          const buffered = (estimated * ESTIMATE_BUFFER_NUM) / ESTIMATE_BUFFER_DEN;
          gas = buffered > MAX_TX_GAS ? MAX_TX_GAS : buffered;
        } catch {
          gas = FALLBACK_CONTRACT_GAS;
        }
      }

      const txHash = await walletClient.sendTransaction({
        chain: walletClient.chain,
        to: params.to,
        data: params.data,
        ...(params.value != null && { value: params.value }),
        ...(gas != null && { gas }),
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        if (receipt.status === "reverted") {
          const err = new Error("Transaction reverted on-chain");
          (err as unknown as { txHash: `0x${string}` }).txHash = txHash;
          throw err;
        }
      }
      return txHash;
    },
    [walletClient, publicClient]
  );

  return { sendTransaction };
}
