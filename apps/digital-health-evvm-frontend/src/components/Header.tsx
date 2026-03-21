import { useState, useEffect } from "react";
import { useAccount, useBalance, useChainId, useSwitchChain, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatUnits } from "viem";
import { tempoModerato } from "viem/chains";
import { CHAIN_ID, NETWORK_DISPLAY_NAME } from "../config/contracts";
import { TEMPO_MODERATO_FEE_TOKENS, TEMPO_MODERATO_FEE_DECIMALS } from "../config/tempoStablecoins";

const CHAIN_UI = {
  name: "Tempo Moderato",
  explorer: "https://explore.moderato.tempo.xyz",
  faucet: "https://docs.tempo.xyz",
  nativeDecimals: 6,
  nativeLabel: "USD",
} as const;

export function Header() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: ethBalance } = useBalance({ address });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (!isConnected || chainId === undefined || chainId === CHAIN_ID) return;
    switchChainAsync({ chainId: CHAIN_ID }).catch(() => {});
  }, [isConnected, chainId, switchChainAsync]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSwitchChain = async () => {
    setIsSwitching(true);
    try {
      await switchChainAsync({ chainId: CHAIN_ID });
    } finally {
      setIsSwitching(false);
    }
  };

  const nativeDisplay =
    ethBalance?.value !== undefined
      ? `${parseFloat(formatUnits(ethBalance.value, CHAIN_UI.nativeDecimals)).toFixed(4)} ${CHAIN_UI.nativeLabel}`
      : `— ${CHAIN_UI.nativeLabel}`;

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">Digital Health EVVM</h1>
        <div className="wallet">
          {isConnected && address ? (
            <div className="wallet-connected">
              {chainId !== CHAIN_ID && (
                <button
                  type="button"
                  className="btn btn-chain"
                  onClick={handleSwitchChain}
                  disabled={isSwitching}
                  title={`Switch to ${NETWORK_DISPLAY_NAME}`}
                >
                  {isSwitching ? "…" : "Switch Chain"}
                </button>
              )}
              {chainId === CHAIN_ID && (
                <span className="btn btn-chain" style={{ cursor: "default" }}>
                  {CHAIN_UI.name}
                </span>
              )}
              <div className="wallet-balance-row">
                <span
                  className="eth-balance"
                  title={`Wallet-reported balance for the active fee token (${TEMPO_MODERATO_FEE_DECIMALS} decimals)`}
                >
                  {nativeDisplay}
                </span>
                <a href={CHAIN_UI.faucet} target="_blank" rel="noopener noreferrer" className="faucet-link" title="Faucet / docs">
                  Faucet
                </a>
              </div>
              {chainId === tempoModerato.id && (
                <p className="tempo-fee-tokens-hint" title="Tempo Moderato testnet fee stablecoins">
                  Fees: {TEMPO_MODERATO_FEE_TOKENS.map((t) => t.symbol).join(" · ")} · {TEMPO_MODERATO_FEE_DECIMALS}{" "}
                  decimals
                </p>
              )}
              <a
                href={`${CHAIN_UI.explorer}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="wallet-addr wallet-link"
                title="View on explorer"
              >
                {address.slice(0, 6)}…{address.slice(-4)}
              </a>
              <button className="btn btn-copy" onClick={copyAddress} title="Copy address">
                {copied ? "Copied!" : "Copy"}
              </button>
              <button className="btn" onClick={() => disconnect()}>
                Disconnect
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => connect({ connector: injected() })}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
