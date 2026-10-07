import { NextRequest, NextResponse } from "next/server";
import { askNexus, type ChatTurn } from "@/lib/ai/ask";
import { GeminiError, geminiConfigured } from "@/lib/ai/gemini";
import { ipAllowed, spendDailyBudget } from "@/lib/ai/limits";
import { AI_DISCLAIMER } from "@/lib/legal/terms";

const MAX_QUESTION = 300;
const MAX_HISTORY = 6;
const MAX_TURN = 800;

const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (!geminiConfigured()) return fail("The assistant isn't configured yet.", 503);

  let body: { question?: unknown; history?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return fail("Ask a question first.", 400);
  if (question.length > MAX_QUESTION) return fail(`Keep it under ${MAX_QUESTION} characters.`, 400);

  // Only role + text survive; anything else a client sends is dropped.
  const history: ChatTurn[] = Array.isArray(body.history)
    ? body.history
        .slice(-MAX_HISTORY)
        .filter((t): t is { role: string; text: string } => !!t && typeof t.text === "string" && (t.role === "user" || t.role === "assistant"))
        .map((t) => ({ role: t.role as ChatTurn["role"], text: t.text.slice(0, MAX_TURN) }))
    : [];

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!ipAllowed(ip)) return fail("You're asking quickly — give it a few seconds and try again.", 429);
  if (!(await spendDailyBudget())) return fail("Today's free AI quota is used up. It resets tomorrow.", 429);

  try {
    const { answer, tools } = await askNexus(history, question);
    return NextResponse.json({ ok: true, answer, tools, disclaimer: AI_DISCLAIMER }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.warn("[ask] failed", err);
    if (err instanceof GeminiError && err.status === 429) return fail("The AI is busy right now. Try again in a minute.", 429);
    return fail("The assistant couldn't answer just now. Please try again.", 502);
  }
}
