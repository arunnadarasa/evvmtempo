import { useEffect, useMemo, useState } from "react";
import { useChainId } from "wagmi";
import { tempo } from "viem/chains";
import { getActivities, subscribeActivities, ActivityEntry } from "../../lib/activityLog";
import { CHAIN_ID, TX_EXPLORER_BASE } from "../../config/contracts";

const PAGE_SIZE = 5;

function formatDate(ts: number): string {
  try {
    const d = new Date(ts);
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatKind(kind: ActivityEntry["kind"]): string {
  if (kind === "dhm_faucet") return "EVVM faucet";
  if (kind === "dhm_mpp" || kind === "dhm_x402") return "DHM MPP";
  if (kind === "usdc_mpp" || kind === "usdc_x402") return "USDC MPP";
  if (kind === "mri_evvm_settlement") return "MRI EVVM";
  if (kind === "mpp_pay_tempo_moderato") return "MPP Tempo testnet";
  if (kind === "mpp_pay_tempo_mainnet") return "MPP Tempo mainnet";
  return kind;
}

function openTransaction(txHash: string, explorerBase: string) {
  window.open(`${explorerBase}/tx/${txHash}`, "_blank", "noopener,noreferrer");
}

/** Mainnet MPP entries are `mpp_pay_tempo_mainnet`; everything else in this app is Moderato (EVVM + testnet MPP). */
function filterActivitiesForChain(entries: ActivityEntry[], chainId: number): ActivityEntry[] {
  if (chainId === tempo.id) {
    return entries.filter((e) => e.kind === "mpp_pay_tempo_mainnet");
  }
  if (chainId === CHAIN_ID) {
    return entries.filter((e) => e.kind !== "mpp_pay_tempo_mainnet");
  }
  return [];
}

export function RecentTransactionsSection() {
  const chainId = useChainId();
  const [logVersion, setLogVersion] = useState(0);

  useEffect(() => subscribeActivities(() => setLogVersion((v) => v + 1)), []);

  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [chainId]);

  const activities = useMemo(
    () => filterActivitiesForChain(getActivities(), chainId),
    [chainId, logVersion]
  );

  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const current = activities.slice(start, start + PAGE_SIZE);

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const chainHint =
    chainId === tempo.id
      ? "Showing Tempo Mainnet activity only (Parallel / mainnet MPP)."
      : chainId === CHAIN_ID
        ? "Showing Tempo Moderato activity only (EVVM faucet, MRI settlement, Moderato MPP)."
        : "Switch to Tempo Moderato or Tempo Mainnet in the header to see activity for that network.";

  return (
    <section className="section">
      <h2>Recent activity</h2>
      <p className="activity-intro">
        Recent EVVM faucet requests and MPP payment attempts. Stored locally in your browser — not from the blockchain.{" "}
        <strong>{chainHint}</strong>
      </p>
      {current.length === 0 ? (
        <div className="activity-empty">
          <p>No activity for this network yet.</p>
          <p className="small">
            {chainId === tempo.id
              ? "Use Pay mainnet / Parallel flows in OpenClaw MRI to log mainnet entries."
              : chainId === CHAIN_ID
                ? "Use the EVVM faucet, MRI EVVM pay, or Moderato MPP ping to log Moderato entries."
                : "Select Tempo Moderato or Tempo Mainnet in the wallet header."}
          </p>
        </div>
      ) : (
        <>
          <ul className="activity-list">
            {current.map((a) => (
              <li key={a.id} className="activity-item">
                <div className="activity-item-header">
                  <span className={`activity-kind activity-kind-${a.kind}`}>{formatKind(a.kind)}</span>
                  <span className="activity-time">{formatDate(a.timestamp)}</span>
                </div>
                <div className="activity-title">{a.title}</div>
                {a.description && <div className="activity-desc">{a.description}</div>}
                {a.txHash && (
                  <div className="activity-actions">
                    <button
                      type="button"
                      className="btn btn-open-tx"
                      onClick={() =>
                        openTransaction(a.txHash!, a.kind === "mpp_pay_tempo_mainnet" ? tempo.blockExplorers.default.url : TX_EXPLORER_BASE)
                      }
                      title="Open transaction on explorer"
                    >
                      View transaction
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="activity-pagination">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrev}
              disabled={safePage === 0}
            >
              Previous
            </button>
            <span className="activity-page-info">
              Page {safePage + 1} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleNext}
              disabled={safePage >= totalPages - 1}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}
