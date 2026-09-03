import Link from "next/link";
import { Bell } from "lucide-react";
import { SiteSearch } from "./SiteSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function TopBar() {
  return (
    <header className="hidden items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3 lg:flex">
      <SiteSearch />
      <div className="flex items-center gap-3">
        <Link
          href="/alerts"
          className="rounded-lg border border-line bg-surface-2 p-2 text-ink-300 hover:bg-hover"
          title="Alerts"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
