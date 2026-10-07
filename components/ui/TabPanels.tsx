"use client";

import { useState } from "react";
import { Segmented } from "./Segmented";

/** Tabs whose panels are ALL rendered in the HTML (inactive ones just
 * hidden), so search engines see every tab's content and switching is instant. */
export function TabPanels({ tabs }: { tabs: { value: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].value);
  return (
    <div className="flex flex-col gap-5">
      <Segmented
        ariaLabel="Section"
        value={active}
        onChange={setActive}
        options={tabs.map((t) => ({ value: t.value, label: t.label }))}
        className="self-start"
      />
      {tabs.map((t) => (
        <div key={t.value} hidden={t.value !== active}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
