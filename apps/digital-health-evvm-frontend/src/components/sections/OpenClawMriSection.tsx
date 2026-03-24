import { useState } from "react";
import { useAccount, useReadContract, useSignMessage, useSwitchChain } from "wagmi";
import { encodeFunctionData, formatUnits, parseUnits } from "viem";
import {
  ADDRESSES,
  CHAIN_ID,
  CHAIN_INFRA_NAME,
  DHM_TOKEN,
  EVVM_ID,
  NETWORK_DISPLAY_NAME,
  TOKEN_SYMBOL,
} from "../../config/contracts";
import { tempoMainnetChain } from "../../config/wagmi";
import { evvmAbi } from "../../abis";
import { buildEvvmPayMessageCoreDoc } from "../../lib/evvmSign";
import { useEvmSendTransaction } from "../../hooks/useEvmSendTransaction";
import { addActivity } from "../../lib/activityLog";
import { createTempoMppx } from "../../lib/mppxTempo";
import { MPP_PATHS, PARALLEL_PATHS, PURL_PATHS, paywallUrl } from "../../lib/paywallUrls";

/** Scenario label for UI / activity log only. On-chain `pay` uses empty `to_identity` so the recipient is `to_address` (treasury). Non-empty identities must exist in NameService or Core reverts. */
const MRI_SCENARIO_LABEL = "OPENCLAW_MRI_SECOND_READ";
const MRI_DEFAULT_AMOUNT = "0.5";

const PARALLEL_SEARCH_BODY = JSON.stringify({
  query: "OpenClaw MRI demo ping",
  mode: "one-shot",
});

function decodeBase64Url(b64url: string): string {
  try {
    const pad = b64url.length % 4 === 0 ? "" : "=".repeat(4 - (b64url.length % 4));
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return atob(b64);
  } catch {
    return "(could not decode)";
  }
}

type BusyKey =
  | null
  | "purl-free"
  | "purl-paid"
  | "mpp-probe"
  | "purl-pay-mod"
  | "purl-pay-main"
  | "mpp-pay-mod"
  | "mpp-pay-main";

export function OpenClawMriSection() {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [purlFreeOut, setPurlFreeOut] = useState("");
  const [purlPaidOut, setPurlPaidOut] = useState("");
  const [purlPayModOut, setPurlPayModOut] = useState("");
  const [purlPayMainOut, setPurlPayMainOut] = useState("");
  const [mppProbeOut, setMppProbeOut] = useState("");
  const [mppPayModOut, setMppPayModOut] = useState("");
  const [mppPayMainOut, setMppPayMainOut] = useState("");
  const [mriStatus, setMriStatus] = useState("");
  const [isMriPending, setIsMriPending] = useState(false);
  const [busy, setBusy] = useState<BusyKey>(null);

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "getBalance",
    args: address ? [address, DHM_TOKEN] : undefined,
  });

  const { data: syncNonce } = useReadContract({
    address: ADDRESSES.evvm,
    abi: evvmAbi,
    functionName: "getNextCurrentSyncNonce",
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
  });

  const { sendTransaction } = useEvmSendTransaction();
  const { signMessageAsync } = useSignMessage();

  const runFetch = async (label: "purl-free" | "purl-paid" | "mpp-probe", url: string, setter: (s: string) => void) => {
    setBusy(label);
    setter("");
    try {
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      let extra = "";
      const pr = res.headers.get("payment-required");
      if (pr) {
        try {
          extra += `\n\nDecoded payment-required (preview):\n${decodeBase64Url(pr)}`;
        } catch {
          extra += `\n\npayment-required: ${pr.slice(0, 120)}…`;
        }
      }
      const www = res.headers.get("www-authenticate");
      if (www) {
        extra += `\n\nWWW-Authenticate:\n${www}`;
      }
      setter(`HTTP ${res.status}\n\n${text.slice(0, 4000)}${text.length > 4000 ? "\n…(truncated)" : ""}${extra}`);
    } catch (e) {
      setter(
        `Request failed: ${e instanceof Error ? e.message : String(e)}\n\n` +
          `If you see a CORS error, run the app with \`npm run dev\` (Vite proxies these origins), or use \`purl\` / \`mppx\` CLIs in a terminal.`
      );
    } finally {
      setBusy(null);
    }
  };

  const payTempoModerato = async (busyKey: "purl-pay-mod" | "mpp-pay-mod", setOut: (s: string) => void) => {
    if (!address) {
      setOut("Connect a wallet first.");
      return;
    }
    setBusy(busyKey);
    setOut("");
    try {
      await switchChainAsync({ chainId: CHAIN_ID });
      const mppx = createTempoMppx();
      const url = paywallUrl(MPP_PATHS.pingPaid, "mpp");
      const res = await mppx.fetch(url, { method: "GET" });
      const text = await res.text();
      let extra = "";
      const receipt = res.headers.get("payment-receipt");
      if (receipt) {
        extra += `\n\nPayment-Receipt (preview):\n${receipt.slice(0, 3000)}${receipt.length > 3000 ? "…" : ""}`;
      }
      setOut(`HTTP ${res.status}\n\n${text.slice(0, 4000)}${text.length > 4000 ? "\n…(truncated)" : ""}${extra}`);
      if (res.ok) {
        addActivity({
          kind: "mpp_pay_tempo_moderato",
          title: `MPP ping paid (${CHAIN_INFRA_NAME})`,
          description: `GET ${MPP_PATHS.pingPaid}`,
        });
      }
    } catch (e) {
      setOut(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const payTempoMainnet = async (busyKey: "purl-pay-main" | "mpp-pay-main", setOut: (s: string) => void) => {
    if (!address) {
      setOut("Connect a wallet first.");
      return;
    }
    setBusy(busyKey);
    setOut("");
    try {
      await switchChainAsync({ chainId: tempoMainnetChain.id });
      const mppx = createTempoMppx();
      const url = paywallUrl(PARALLEL_PATHS.search, "parallel");
      const res = await mppx.fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: PARALLEL_SEARCH_BODY,
      });
      const text = await res.text();
      let extra = "";
      const receipt = res.headers.get("payment-receipt");
      if (receipt) {
        extra += `\n\nPayment-Receipt (preview):\n${receipt.slice(0, 3000)}${receipt.length > 3000 ? "…" : ""}`;
      }
      setOut(`HTTP ${res.status}\n\n${text.slice(0, 4000)}${text.length > 4000 ? "\n…(truncated)" : ""}${extra}`);
      if (res.ok) {
        addActivity({
          kind: "mpp_pay_tempo_mainnet",
          title: "Parallel search paid (Tempo mainnet)",
          description: `POST ${PARALLEL_PATHS.search} · PathUSD`,
        });
      }
    } catch (e) {
      setOut(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const handleMriEvvmPay = async () => {
    if (!address || chainId !== CHAIN_ID || syncNonce == null) return;

    let parsedAmount: bigint;
    try {
      parsedAmount = parseUnits(MRI_DEFAULT_AMOUNT, 18);
    } catch {
      setMriStatus("Invalid amount.");
      return;
    }

    const bal = (balance as bigint) ?? 0n;
    if (bal < parsedAmount) {
      setMriStatus(`Need at least ${MRI_DEFAULT_AMOUNT} ${TOKEN_SYMBOL} (use the EVVM faucet above).`);
      return;
    }

    const recipient = ADDRESSES.treasury;
    setIsMriPending(true);
    setMriStatus("Signing MRI clearing payment…");
    try {
      const nonce = syncNonce as bigint;
      const payMessage = buildEvvmPayMessageCoreDoc(
        EVVM_ID,
        ADDRESSES.evvm,
        recipient,
        "",
        DHM_TOKEN,
        parsedAmount,
        0n,
        address,
        nonce,
        false
      );
      const signature = await signMessageAsync({ message: payMessage });

      setMriStatus("Submitting on-chain…");
      const txHash = await sendTransaction({
        to: ADDRESSES.evvm,
        data: encodeFunctionData({
          abi: evvmAbi,
          functionName: "pay",
          args: [
            address,
            recipient,
            "",
            DHM_TOKEN,
            parsedAmount,
            0n,
            address,
            nonce,
            false,
            signature as `0x${string}`,
          ],
        }),
      });

      await refetchBalance();
      setMriStatus(
        `Agent B paid ${MRI_DEFAULT_AMOUNT} ${TOKEN_SYMBOL} to treasury ${recipient.slice(0, 6)}…${recipient.slice(-4)} (${MRI_SCENARIO_LABEL}).`
      );
      addActivity({
        kind: "mri_evvm_settlement",
        title: "MRI second-read (EVVM)",
        description: `${MRI_DEFAULT_AMOUNT} ${TOKEN_SYMBOL} to treasury · ${MRI_SCENARIO_LABEL}`,
        txHash: txHash as string,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMriStatus(
        msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") ? "Signing cancelled." : `Error: ${msg}`
      );
    } finally {
      setIsMriPending(false);
    }
  };

  const purlFreeUrl = paywallUrl(PURL_PATHS.free, "purl");
  const purlPaidUrl = paywallUrl(PURL_PATHS.paid, "purl");
  const mppPingUrl = paywallUrl(MPP_PATHS.pingPaid, "mpp");

  const payBusy = busy?.startsWith("purl-pay") || busy?.startsWith("mpp-pay");

  return (
    <section className="section openclaw-mri">
      <h2>OpenClaw agents — MRI second read (Purl, MPP, EVVM)</h2>
      <p className="openclaw-mri-lede">
        Scenario: <strong>Agent A</strong> (ordering clinician) requests an independent MRI read.{" "}
        <strong>Agent B</strong> (coverage / billing) pays the machine-paywalled API gate (<abbr title="Machine Payments Protocol">MPP</abbr>,{" "}
        <abbr title="HTTP 402 Payment Required">HTTP 402</abbr>), then settles a matching ledger line on{" "}
        <strong>{NETWORK_DISPLAY_NAME}</strong> using EVVM <code>pay()</code> — same chain as this app (
        <strong>{CHAIN_ID}</strong>).
      </p>

      <div className="openclaw-grid">
        <div className="openclaw-card">
          <h3>1. Purl (Stripe) — free vs paid testpoints</h3>
          <p className="small muted">
            <a href="https://www.purl.dev/" target="_blank" rel="noopener noreferrer">
              purl.dev
            </a>{" "}
            ships <strong>free</strong> JSON and Stripe&apos;s <strong>/test/paid</strong> probe (often <strong>Base Sepolia</strong>{" "}
            x402 in the <code>payment-required</code> snapshot). Use <strong>Pay Tempo</strong> buttons for real{" "}
            <strong>PathUSD</strong> settlement via <code>mppx</code> — same MPP rail as section 2 (Moderato ping) and Parallel
            (mainnet search), not the Stripe-hosted x402 bytes.
          </p>
          <p className="small muted" style={{ marginTop: "0.5rem" }}>
            CLI: <code className="mono-addr">purl https://www.purl.dev/test/paid</code>
          </p>
          <div className="form-actions openclaw-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null}
              onClick={() => runFetch("purl-free", purlFreeUrl, setPurlFreeOut)}
            >
              {busy === "purl-free" ? "Fetching…" : "Free testpoint"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null}
              onClick={() => runFetch("purl-paid", purlPaidUrl, setPurlPaidOut)}
            >
              {busy === "purl-paid" ? "Fetching…" : "Paid probe (402)"}
            </button>
          </div>
          <p className="small muted" style={{ marginTop: "0.75rem" }}>
            <strong>Tempo payment (wallet + mppx)</strong>
          </p>
          <div className="form-actions openclaw-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null || !address}
              onClick={() => payTempoModerato("purl-pay-mod", setPurlPayModOut)}
            >
              {busy === "purl-pay-mod" ? "Paying…" : `Pay — Moderato (${CHAIN_ID})`}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null || !address}
              onClick={() => payTempoMainnet("purl-pay-main", setPurlPayMainOut)}
            >
              {busy === "purl-pay-main" ? "Paying…" : `Pay — Mainnet (${tempoMainnetChain.id})`}
            </button>
          </div>
          {!address && <p className="address small muted">Connect wallet to run Tempo payments.</p>}
          {purlFreeOut && (
            <pre className="openclaw-pre" role="status">
              {purlFreeOut}
            </pre>
          )}
          {purlPaidOut && (
            <pre className="openclaw-pre" role="status">
              {purlPaidOut}
            </pre>
          )}
          {purlPayModOut && (
            <pre className="openclaw-pre" role="status">
              {purlPayModOut}
            </pre>
          )}
          {purlPayMainOut && (
            <pre className="openclaw-pre" role="status">
              {purlPayMainOut}
            </pre>
          )}
        </div>

        <div className="openclaw-card">
          <h3>2. MPP — Tempo charge on this chain</h3>
          <p className="small muted">
            <a href="https://mpp.dev/" target="_blank" rel="noopener noreferrer">
              mpp.dev
            </a>{" "}
            <strong>paid ping</strong> targets <strong>{CHAIN_INFRA_NAME}</strong> in the challenge. <strong>Parallel</strong> (
            <a href="https://parallelmpp.dev/" target="_blank" rel="noopener noreferrer">
              parallelmpp.dev
            </a>
            ) exposes a <strong>mainnet</strong> MPP search that charges <strong>PathUSD</strong> on chain{" "}
            <strong>{tempoMainnetChain.id}</strong>. Both use the <code>mppx</code> client below.
          </p>
          <div className="form-actions openclaw-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null}
              onClick={() => runFetch("mpp-probe", mppPingUrl, setMppProbeOut)}
            >
              {busy === "mpp-probe" ? "Fetching…" : "MPP ping probe (402)"}
            </button>
          </div>
          <p className="small muted" style={{ marginTop: "0.75rem" }}>
            <strong>Pay with wallet (PathUSD)</strong>
          </p>
          <div className="form-actions openclaw-actions">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null || !address}
              onClick={() => payTempoModerato("mpp-pay-mod", setMppPayModOut)}
            >
              {busy === "mpp-pay-mod" ? "Paying…" : `Pay ping — Moderato (${CHAIN_ID})`}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null || !address}
              onClick={() => payTempoMainnet("mpp-pay-main", setMppPayMainOut)}
            >
              {busy === "mpp-pay-main" ? "Paying…" : `Pay search — Mainnet (${tempoMainnetChain.id})`}
            </button>
          </div>
          {!address && <p className="address small muted">Connect wallet to pay.</p>}
          {mppProbeOut && (
            <pre className="openclaw-pre" role="status">
              {mppProbeOut}
            </pre>
          )}
          {mppPayModOut && (
            <pre className="openclaw-pre" role="status">
              {mppPayModOut}
            </pre>
          )}
          {mppPayMainOut && (
            <pre className="openclaw-pre" role="status">
              {mppPayMainOut}
            </pre>
          )}
        </div>

        <div className="openclaw-card openclaw-card-wide">
          <h3>3. EVVM settlement — Agent B pays the clearing line</h3>
          <p className="small muted">
            After the HTTP gate signals payment (MPP / 402), Agent B sends <strong>{MRI_DEFAULT_AMOUNT} {TOKEN_SYMBOL}</strong> to
            the demo treasury (<code className="mono-addr">{ADDRESSES.treasury}</code>
            ). EVVM resolves a non-empty <code>to_identity</code> through NameService, so this button uses the same path as{" "}
            <strong>EVVM Core → Transfer</strong> (empty identity, pay by address). Scenario tag:{" "}
            <code>{MRI_SCENARIO_LABEL}</code>.
          </p>
          {address && chainId === CHAIN_ID ? (
            <>
              <div className="form-row">
                <label>Your {TOKEN_SYMBOL} balance</label>
                <div>
                  {balance !== undefined && balance !== null ? formatUnits(balance as bigint, 18) : "—"} {TOKEN_SYMBOL}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-primary" onClick={handleMriEvvmPay} disabled={isMriPending || payBusy}>
                  {isMriPending ? "Paying…" : `Pay MRI fee (${MRI_DEFAULT_AMOUNT} ${TOKEN_SYMBOL})`}
                </button>
              </div>
              {mriStatus && <p className="status">{mriStatus}</p>}
            </>
          ) : (
            <p className="address">Connect a wallet on {NETWORK_DISPLAY_NAME} to run the EVVM leg.</p>
          )}
        </div>
      </div>
    </section>
  );
}
