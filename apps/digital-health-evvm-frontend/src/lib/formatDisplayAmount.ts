import { formatUnits } from "viem";

/**
 * Format a token amount for UI without `Number` (avoids scientific notation on large values).
 */
export function formatDisplayAmount(
  value: bigint,
  decimals: number,
  options?: { maxFractionDigits?: number; maxIntegerDigits?: number }
): { text: string; fullPrecision: string } {
  const maxFractionDigits = options?.maxFractionDigits ?? 4;
  const maxIntegerDigits = options?.maxIntegerDigits ?? 21;

  const fullPrecision = formatUnits(value, decimals);
  const neg = fullPrecision.startsWith("-");
  const abs = neg ? fullPrecision.slice(1) : fullPrecision;
  const [intPart, fracPart = ""] = abs.split(".");

  const intNorm = intPart.replace(/^0+(?=\d)/, "") || "0";
  let intForDisplay = intNorm;
  let truncated = false;
  if (intNorm.length > maxIntegerDigits) {
    intForDisplay = `${intNorm.slice(0, 12)}…`;
    truncated = true;
  }

  const frac = fracPart.slice(0, maxFractionDigits).replace(/0+$/, "");
  const intComma = intForDisplay.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = frac && !truncated ? `${intComma}.${frac}` : intComma;
  const text = neg ? `−${body}` : body;

  return { text, fullPrecision: neg ? `−${fullPrecision}` : fullPrecision };
}
