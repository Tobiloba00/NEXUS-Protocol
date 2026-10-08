import { RISK_LABEL, type RiskLevel } from "@/lib/risk/score";

// Short forms for phones, where every character of the coin name matters.
const SHORT: Record<RiskLevel, string> = { low: "Low", medium: "Caution", high: "High" };

const STYLE: Record<RiskLevel, string> = {
  low: "bg-pos-soft text-pos",
  medium: "bg-[color-mix(in_srgb,var(--warn)_18%,transparent)] text-warn",
  high: "bg-neg-soft text-neg",
};

/** Small status capsule: "Lower risk" / "Caution" / "High risk". */
export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-[2px] text-[11.5px] font-semibold tracking-[-0.005em] ${STYLE[level]}`}
    >
      <span className="sm:hidden">{SHORT[level]}</span>
      <span className="hidden sm:inline">{RISK_LABEL[level]}</span>
    </span>
  );
}
