"use client";

/** iOS segmented control: one rounded track, a thumb that slides to the
 * selected option. Equal-width segments, so the thumb is just
 * translateX(index * 100%) of one segment — no measuring needed. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-grid rounded-[10px] bg-[var(--seg-track)] p-[2px] ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-[2px] left-[2px] rounded-[8px] bg-[var(--seg-thumb)] shadow-[var(--seg-thumb-shadow)] transition-transform duration-300 ease-[cubic-bezier(0.3,1.2,0.4,1)]"
        style={{
          width: `calc((100% - 4px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 whitespace-nowrap px-3.5 py-[9px] text-[13.5px] md:py-[5px] md:text-[13px] font-medium tracking-[-0.005em] transition-colors ${
            o.value === value ? "text-ink-50" : "text-ink-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
