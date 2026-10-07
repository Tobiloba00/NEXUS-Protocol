/** Page container: consistent gutters and a gentle entrance. `narrow` is for
 * single-column reading/forms (alerts, predictions). */
export function Page({
  children,
  narrow = false,
}: {
  children: React.ReactNode;
  narrow?: boolean;
}) {
  return (
    <main
      className={`rise mx-auto flex w-full flex-col gap-9 px-5 pb-8 pt-7 sm:px-8 lg:pt-10 ${
        narrow ? "max-w-[720px]" : "max-w-[1120px]"
      }`}
    >
      {children}
    </main>
  );
}

/** iOS "large title" header with an optional subtitle and trailing slot. */
export function PageHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="t-large-title">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[15px] leading-snug tracking-[-0.01em] text-ink-400">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0 pb-1">{trailing}</div>}
    </header>
  );
}
