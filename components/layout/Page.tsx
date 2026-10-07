/**
 * Page container: consistent gutters and a gentle entrance.
 *
 * Layout is responsive by construction, with three cases:
 *  - default: one full-width column (home, trade, NFTs, listings).
 *  - `aside`: a main column plus a side panel. From the `lg` breakpoint the
 *    panel sits to the right and stays in view while scrolling; below it,
 *    the panel simply stacks under the main column. Wide screens never end
 *    up with empty gutters around a narrow column.
 *  - `narrow`: a single reading column, for pages that have nothing worth
 *    putting beside them.
 */
export function Page({
  children,
  aside,
  narrow = false,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  narrow?: boolean;
}) {
  const shell = `rise mx-auto w-full px-5 pb-8 pt-7 sm:px-8 lg:pt-10 ${narrow && !aside ? "max-w-[720px]" : "max-w-[1120px]"}`;

  if (aside) {
    return (
      <main className={shell}>
        <div className="grid grid-cols-1 gap-9 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <div className="flex min-w-0 flex-col gap-9">{children}</div>
          <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-[88px] lg:self-start">{aside}</aside>
        </div>
      </main>
    );
  }

  return <main className={`${shell} flex flex-col gap-9`}>{children}</main>;
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
