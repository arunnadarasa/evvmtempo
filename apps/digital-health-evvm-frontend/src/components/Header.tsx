import { useState, useMemo } from "react";
import { useAccount, useReadContract, useChainId, useSwitchChain, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { tempo, tempoModerato } from "viem/chains";
import { CHAIN_INFRA_NAME, NETWORK_DISPLAY_NAME } from "../config/contracts";
import {
  TEMPO_MODERATO_FEE_TOKENS,
  TEMPO_MODERATO_FEE_DECIMALS,
  TEMPO_MAINNET_USDC,
} from "../config/tempoStablecoins";
import { formatDisplayAmount } from "../lib/formatDisplayAmount";

const PATH_USD = TEMPO_MODERATO_FEE_TOKENS[0];
const PATH_USD_DECIMALS = TEMPO_MODERATO_FEE_DECIMALS;

const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

const TEMPO_WALLET_CHAINS = [
  {
    id: tempoModerato.id,
    label: "Tempo Moderato",
    explorer: tempoModerato.blockExplorers.default.url,
  },
  {
    id: tempo.id,
    label: "Tempo Mainnet",
    explorer: tempo.blockExplorers.default.url,
  },
] as const;

const CHAIN_UI = {
  faucet: "https://docs.tempo.xyz",
} as const;

export function Header() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const { data: pathUsdBalance } = useReadContract({
    address: PATH_USD.address,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: tempoModerato.id,
    query: { enabled: Boolean(address && chainId === tempoModerato.id) },
  });

  const { data: mainnetUsdcBalance } = useReadContract({
    address: TEMPO_MAINNET_USDC.address,
    abi: erc20BalanceAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: tempo.id,
    query: { enabled: Boolean(address && chainId === tempo.id) },
  });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const isConfiguredTempoChain = TEMPO_WALLET_CHAINS.some((c) => c.id === chainId);

  const explorerBase = useMemo(() => {
    const row = TEMPO_WALLET_CHAINS.find((c) => c.id === chainId);
    return row?.explorer ?? TEMPO_WALLET_CHAINS[0].explorer;
  }, [chainId]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleNetworkChange = async (nextId: number) => {
    setIsSwitching(true);
    try {
      await switchChainAsync({ chainId: nextId });
    } finally {
      setIsSwitching(false);
    }
  };

  const feeTooltip = useMemo(() => {
    if (chainId === tempoModerato.id) {
      return `${NETWORK_DISPLAY_NAME} on ${CHAIN_INFRA_NAME}: gas uses ${TEMPO_MODERATO_FEE_TOKENS.map((t) => t.symbol).join(", ")} (${TEMPO_MODERATO_FEE_DECIMALS} decimals)`;
    }
    if (chainId === tempo.id) {
      return `Tempo Mainnet: fee token USDC (${TEMPO_MAINNET_USDC.decimals} decimals) for wallet / RPC.`;
    }
    return "Choose Tempo Moderato or Tempo Mainnet.";
  }, [chainId]);

  const feeBalanceRow = useMemo(() => {
    if (chainId === tempoModerato.id) {
      if (pathUsdBalance === undefined || pathUsdBalance === null) return null;
      const d = formatDisplayAmount(pathUsdBalance as bigint, PATH_USD_DECIMALS, {
        maxFractionDigits: 2,
        maxIntegerDigits: 96,
      });
      return {
        label: `${PATH_USD.symbol} balance`,
        unit: PATH_USD.symbol,
        display: d,
        decimals: PATH_USD_DECIMALS,
        contract: PATH_USD.address,
      };
    }
    if (chainId === tempo.id) {
      if (mainnetUsdcBalance === undefined || mainnetUsdcBalance === null) return null;
      const d = formatDisplayAmount(mainnetUsdcBalance as bigint, TEMPO_MAINNET_USDC.decimals, {
        maxFractionDigits: 2,
        maxIntegerDigits: 96,
      });
      return {
        label: `${TEMPO_MAINNET_USDC.symbol} balance`,
        unit: TEMPO_MAINNET_USDC.symbol,
        display: d,
        decimals: TEMPO_MAINNET_USDC.decimals,
        contract: TEMPO_MAINNET_USDC.address,
      };
    }
    return null;
  }, [chainId, pathUsdBalance, mainnetUsdcBalance]);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <h1 className="logo" aria-label="Digital Health EVVM">
            <span className="logo-line logo-digital">Digital</span>
            <span className="logo-line logo-health">Health EVVM</span>
          </h1>
        </div>

        <div className="wallet">
          {isConnected && address ? (
            <div className="header-wallet-surface">
              <div className="header-wallet-panel">
                <div className="header-wallet-row header-wallet-row-network">
                  <select
                    className="network-select"
                    aria-label="Tempo network"
                    title={feeTooltip}
                    disabled={isSwitching}
                    value={isConfiguredTempoChain ? chainId : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      void handleNetworkChange(Number(v));
                    }}
                  >
                    {!isConfiguredTempoChain ? <option value="">Select Tempo network…</option> : null}
                    {TEMPO_WALLET_CHAINS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.id})
                      </option>
                    ))}
                  </select>
                  <a
                    href={CHAIN_UI.faucet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="faucet-link faucet-link-header"
                    title="Tempo docs & faucets"
                  >
                    Faucet
                  </a>
                </div>

                <div className="header-balance-row">
                  <span className="header-balance-label">
                    {feeBalanceRow?.label ??
                      (chainId === tempo.id
                        ? `${TEMPO_MAINNET_USDC.symbol} balance`
                        : `${PATH_USD.symbol} balance`)}
                  </span>
                  <span
                    className="balance-value balance-value-wrap"
                    title={
                      feeBalanceRow
                        ? `Exact: ${feeBalanceRow.display.fullPrecision} ${feeBalanceRow.unit} (${feeBalanceRow.decimals} decimals) · ${feeBalanceRow.contract}`
                        : !isConfiguredTempoChain
                          ? "Select Tempo Moderato (PathUSD) or Tempo Mainnet (USDC)"
                          : chainId === tempo.id
                            ? TEMPO_MAINNET_USDC.address
                            : PATH_USD.address
                    }
                  >
                    {feeBalanceRow ? (
                      <>
                        {feeBalanceRow.display.text}{" "}
                        <span className="balance-unit">{feeBalanceRow.unit}</span>
                      </>
                    ) : (
                      <>
                        —{" "}
                        <span className="balance-unit">
                          {chainId === tempo.id ? TEMPO_MAINNET_USDC.symbol : PATH_USD.symbol}
                        </span>
                      </>
                    )}
                  </span>
                </div>

                <div className="header-wallet-row header-wallet-row-actions">
                  <a
                    href={`${explorerBase}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wallet-addr wallet-link wallet-addr-truncate"
                    title="View on explorer"
                  >
                    {address.slice(0, 6)}…{address.slice(-4)}
                  </a>
                  <div className="header-btn-group">
                    <button type="button" className="btn btn-copy" onClick={copyAddress} title="Copy full address">
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => disconnect()}>
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => connect({ connector: injected() })}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
