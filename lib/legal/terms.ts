/**
 * Bump TERMS_VERSION whenever the Terms, Privacy Policy or Risk Disclaimer
 * change in a way users should re-accept: everyone who accepted an older
 * version sees the agreement dialog again.
 */
export const TERMS_VERSION = "2026-10-07";
export const TERMS_STORAGE_KEY = "nexus-terms-accepted";

/** Attached to every AI answer by the server (not left to the model to remember). */
export const AI_DISCLAIMER =
  "AI-generated from public data. Information only — not financial advice. NEXUS accepts no liability for any loss arising from its use.";

/** Optional public contact address, shown on the legal pages when set. */
export const LEGAL_CONTACT_EMAIL = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL ?? "";
