import { TEMPO_MODERATO_FEE_TOKENS } from "../../config/tempoStablecoins";

export function ExplainerSection() {
  return (
    <section className="section">
      <h2>How the payments work</h2>
      <p>
        This section explains EVVM payments on <strong>Tempo Moderato</strong> in simple language so you can focus on
        building Clinical Agents without deep blockchain expertise.
      </p>
      <div className="tempo-fee-callout">
        <h3>Tempo Moderato: fee stablecoins (not ETH)</h3>
        <p>
          On chain <strong>42431</strong>, transaction fees are paid in USD stablecoins (<strong>6 decimals</strong>),
          not native ETH. The testnet commonly uses four fee tokens; the public faucet often tops up all of them:
        </p>
        <table className="tempo-fee-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {TEMPO_MODERATO_FEE_TOKENS.map((t) => (
              <tr key={t.address}>
                <td>{t.name}</td>
                <td>
                  <code className="mono-addr">{t.address}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small">
          PathUSD matches <code>viem/tempo</code> <code>Addresses.pathUsd</code>. See{" "}
          <a href="https://docs.tempo.xyz" target="_blank" rel="noopener noreferrer">
            docs.tempo.xyz
          </a>{" "}
          for faucets and network details.
        </p>
      </div>
      <div className="grid-2">
        <div>
          <h3>1. Paying with MATE via EVVM Core</h3>
          <p>
            The principal token (<strong>MATE</strong>) is tracked inside EVVM Core. You can use the in-app faucet, sign{" "}
            <code>pay()</code> messages for transfers, and rely on sync/async nonces so each payment is only used once.
          </p>
          <ul>
            <li>
              <strong>Async nonces</strong>: each signed payment has a unique number so it can only be used once,
              stopping replays.
            </li>
            <li>
              <strong>Executors / fishers</strong>: a helper address can submit your signed payment on-chain and take a
              small fee.
            </li>
          </ul>
        </div>
        <div>
          <h3>2. HTTP paywalls on Tempo (reference)</h3>
          <p>
            For “pay before content” over HTTP, Tempo ecosystems often use <strong>MPP</strong>-style flows and tools
            such as <code>mppx</code>; see{" "}
            <a href="https://mpp.dev" target="_blank" rel="noopener noreferrer">
              mpp.dev
            </a>{" "}
            and the DanceTempo reference app for wallet bundles and discovery. This demo focuses on EVVM Core and
            on-chain MATE; wire HTTP paywalls separately if your agent needs them.
          </p>
        </div>
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <h3>How to think about this as a builder</h3>
        <ul>
          <li>
            <strong>Lovable / no‑code developers</strong>: treat EVVM like a ledger for agent micropayments — fund MATE
            via the faucet, then automate signed <code>pay()</code> flows.
          </li>
          <li>
            <strong>OpenClaw Agents</strong>: plan the payment, request a wallet signature, and submit or relay the
            transaction.
          </li>
          <li>
            <strong>Clinical teams</strong>: think in terms of agents that receive tiny MATE payments for access or
            scheduling — without learning Solidity.
          </li>
        </ul>
      </div>
    </section>
  );
}
