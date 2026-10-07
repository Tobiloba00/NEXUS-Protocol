import Link from "next/link";

/** Title on the left, optional quiet link or control on the right. */
export function SectionHeader({
  title,
  href,
  hrefLabel = "See all",
  trailing,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex min-h-[34px] items-center justify-between gap-3 px-1">
      <h2 className="t-title">{title}</h2>
      {trailing ??
        (href && (
          <Link href={href} className="press text-[15px] font-medium tracking-[-0.01em] text-accent">
            {hrefLabel}
          </Link>
        ))}
    </div>
  );
}
