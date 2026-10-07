/**
 * On-chain token security scan via GoPlus (free, keyless — confirmed working
 * for Solana and EVM during this build). Server-only: called through
 * app/api/risk/route.ts so results are CDN-cached and we never exceed their
 * rate limit no matter how many visitors tap "Run security scan".
 *
 * GoPlus reports *contract-level* facts (can the creator mint more? freeze
 * your tokens? is it a honeypot?). Those are the checks the trading-signal
 * score in score.ts can't see.
 */

export type CheckStatus = "ok" | "warn" | "bad";
export type SecurityCheck = { label: string; status: CheckStatus; detail: string };
export type SecurityReport = { verdict: CheckStatus; checks: SecurityCheck[] };

const EVM_CHAIN_IDS: Record<string, string> = {
  ethereum: "1",
  bsc: "56",
  base: "8453",
  arbitrum: "42161",
  polygon: "137",
  optimism: "10",
  avalanche: "43114",
};

export const SUPPORTED_CHAINS = ["solana", ...Object.keys(EVM_CHAIN_IDS)];

const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export function isValidTarget(chain: string, address: string) {
  if (chain === "solana") return SOLANA_ADDRESS.test(address);
  return chain in EVM_CHAIN_IDS && EVM_ADDRESS.test(address);
}

const on = (v: unknown) => v === "1" || v === 1 || v === true;
const authorityOn = (v: unknown) => on((v as { status?: unknown } | undefined)?.status);

/** Returns null when GoPlus has no record of the token (too new / unindexed). */
export async function fetchSecurityReport(chain: string, address: string): Promise<SecurityReport | null> {
  const url =
    chain === "solana"
      ? `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${address}`
      : `https://api.gopluslabs.io/api/v1/token_security/${EVM_CHAIN_IDS[chain]}?contract_addresses=${address.toLowerCase()}`;

  const res = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`GoPlus ${res.status}`);
  const json = await res.json();
  const data = json?.result ? (Object.values(json.result)[0] as Record<string, unknown> | undefined) : undefined;
  if (!data || Object.keys(data).length === 0) return null;

  const checks = chain === "solana" ? solanaChecks(data) : evmChecks(data);
  const verdict: CheckStatus = checks.some((c) => c.status === "bad")
    ? "bad"
    : checks.some((c) => c.status === "warn")
      ? "warn"
      : "ok";
  const order = { bad: 0, warn: 1, ok: 2 } as const;
  checks.sort((a, b) => order[a.status] - order[b.status]);
  return { verdict, checks };
}

function solanaChecks(d: Record<string, unknown>): SecurityCheck[] {
  const out: SecurityCheck[] = [];
  out.push(
    authorityOn(d.mintable)
      ? { label: "Minting", status: "bad", detail: "The creator can still create unlimited new tokens, diluting holders" }
      : { label: "Minting", status: "ok", detail: "No one can mint new tokens (authority revoked)" }
  );
  out.push(
    authorityOn(d.freezable)
      ? { label: "Freezing", status: "bad", detail: "An authority can freeze token accounts, blocking you from selling" }
      : { label: "Freezing", status: "ok", detail: "No one can freeze your tokens" }
  );
  if (authorityOn(d.balance_mutable_authority))
    out.push({ label: "Balances", status: "bad", detail: "An authority can change wallet balances" });
  if (authorityOn(d.closable))
    out.push({ label: "Closable", status: "bad", detail: "An authority can close the token's accounts" });
  if (on(d.non_transferable))
    out.push({ label: "Transfers", status: "bad", detail: "Token is non-transferable — it can't be moved or sold" });
  const fee = d.transfer_fee as Record<string, unknown> | undefined;
  if (fee && Object.keys(fee).length > 0)
    out.push({ label: "Transfer fee", status: "warn", detail: "Every transfer is charged a fee" });
  const hook = d.transfer_hook as unknown[] | undefined;
  if (Array.isArray(hook) && hook.length > 0)
    out.push({ label: "Transfer hook", status: "warn", detail: "Custom code runs on every transfer" });
  if (authorityOn(d.metadata_mutable))
    out.push({ label: "Metadata", status: "warn", detail: "Name, symbol and image can still be changed" });
  if (on(d.trusted_token)) out.push({ label: "Reputation", status: "ok", detail: "Listed as a trusted token" });
  return out;
}

function evmChecks(d: Record<string, unknown>): SecurityCheck[] {
  const out: SecurityCheck[] = [];
  if (on(d.is_honeypot)) out.push({ label: "Honeypot", status: "bad", detail: "Buyers cannot sell this token" });
  else out.push({ label: "Honeypot", status: "ok", detail: "Not flagged as a honeypot" });

  if (on(d.cannot_buy)) out.push({ label: "Buying", status: "bad", detail: "This token cannot be bought" });

  for (const [key, label] of [["buy_tax", "Buy tax"], ["sell_tax", "Sell tax"]] as const) {
    const raw = d[key];
    if (raw === undefined || raw === "") continue;
    const tax = Number(raw);
    if (!Number.isFinite(tax)) continue;
    const pct = (tax * 100).toFixed(tax * 100 < 10 ? 1 : 0);
    out.push(
      tax > 0.1
        ? { label, status: "bad", detail: `${pct}% of every trade is taken as tax` }
        : tax > 0.05
          ? { label, status: "warn", detail: `${pct}% tax per trade` }
          : { label, status: "ok", detail: `${pct}% tax` }
    );
  }

  if (on(d.hidden_owner)) out.push({ label: "Owner", status: "bad", detail: "Has a hidden owner with special powers" });
  if (on(d.can_take_back_ownership)) out.push({ label: "Ownership", status: "bad", detail: "Ownership can be taken back after renouncing" });
  if (on(d.owner_change_balance)) out.push({ label: "Balances", status: "bad", detail: "The owner can change wallet balances" });
  if (on(d.selfdestruct)) out.push({ label: "Self-destruct", status: "bad", detail: "The contract can destroy itself" });
  if (on(d.is_mintable)) out.push({ label: "Minting", status: "warn", detail: "More tokens can be minted" });
  if (on(d.transfer_pausable)) out.push({ label: "Transfers", status: "warn", detail: "Transfers can be paused by the owner" });
  if (on(d.trading_cooldown)) out.push({ label: "Cooldown", status: "warn", detail: "Trading cooldown is enabled" });
  if (on(d.is_proxy)) out.push({ label: "Proxy", status: "warn", detail: "Contract logic can be upgraded" });

  if (d.is_open_source === "0") out.push({ label: "Source code", status: "warn", detail: "Contract source isn't verified" });
  else if (on(d.is_open_source)) out.push({ label: "Source code", status: "ok", detail: "Contract source is verified" });

  const holders = Number(d.holder_count);
  if (Number.isFinite(holders) && holders > 0) {
    out.push({
      label: "Holders",
      status: holders < 50 ? "warn" : "ok",
      detail: `${holders.toLocaleString("en-US")} holders`,
    });
  }
  const creatorPct = Number(d.creator_percent);
  if (Number.isFinite(creatorPct) && creatorPct > 0.2) {
    out.push({ label: "Creator share", status: "warn", detail: `Creator holds ${(creatorPct * 100).toFixed(0)}% of supply` });
  }
  return out;
}
