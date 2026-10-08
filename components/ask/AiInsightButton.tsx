"use client";

import { NexusMark } from "@/components/ui/NexusMark";
import { OPEN_ASK_EVENT, type OpenAskDetail } from "./AskLauncher";

/** Opens the AI pop-up and asks it a ready-made question about whatever the
 * visitor is looking at. The answer comes from the same grounded assistant,
 * with the same "information only, no liability" disclaimer attached. */
export function AiInsightButton({
  question,
  label = "AI insight",
  className = "",
}: {
  question: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent<OpenAskDetail>(OPEN_ASK_EVENT, { detail: { question } }))}
      className={`press inline-flex h-11 items-center md:h-10 gap-1.5 rounded-full bg-accent-soft px-4 text-[14px] font-semibold text-accent ${className}`}
    >
      <NexusMark size={17} />
      {label}
    </button>
  );
}
