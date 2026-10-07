import { RISK_LABEL, type RiskLevel } from "@/lib/risk/score";

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
      {RISK_LABEL[level]}
    </span>
  );
}
