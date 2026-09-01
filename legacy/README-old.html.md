# NEXUS Protocol

A production-grade Web3 dashboard — markets, NFTs, staking, governance, analytics, and wallet — in a single static HTML file with React, Tailwind CSS, and live on-chain data.

- **Live data** from three free public APIs (CoinGecko, CoinGecko NFTs, solana.fm) with graceful fallbacks
- **Light / dark / auto** theme system with no-FOUC persistence
- **Hidden admin panel** (`Ctrl/Cmd + Shift + K`) for live rebranding
- **3 one-click brand presets** included (NEXUS / CHRONOS / VERTEX)
- **Fully responsive** — sidebar drawer + bottom tabs on mobile, sheet filters, hideable table columns
- **No build step** — open `index.html` in a browser and it just works

---

## Quick start

```bash
node server.js
# → http://localhost:5173
```

That's it. The bundled `server.js` is a 30-line static file server using Node's built-in `http` + `fs` (no `npm install`). You can also just open `index.html` directly via `file://` — the only thing you lose is correct MIME types for the favicon.

---

## Architecture

- **Single-file HTML/JSX** — `index.html` ships everything: theme variables, Tailwind config, React app via Babel standalone, Recharts for charts, Lucide for icons. All third-party libs are loaded from CDN.
- **HashRouter** so routes work without server-side rewrite rules — drop on any static host.
- **Live data** from three free public APIs (see below). Each has try/catch + graceful fallback to mock data, so the page is never empty.
- **No build step by design.** Open `index.html` in a text editor, change a value, refresh. The single file is the deliverable.

---

## Rebrand in 30 seconds

### Option A — Live admin panel (recommended)

Press **Ctrl/Cmd + Shift + K** to open the rebrand console:

- Edit name, ticker, network, primary/secondary color, logo (emoji or URL)
- 3 one-click presets (NEXUS / CHRONOS / VERTEX)
- **Export** your settings to a JSON file
- **Import** any of the JSON files in `presets/` (or one you've exported)
- Live color preview while the panel is open
- Changes persist in `localStorage` and apply before first paint on reload

### Option B — Edit `PROJECT_CONFIG`

Open `index.html`, find the `PROJECT_CONFIG` block (~line 500), edit:

```js
const PROJECT_CONFIG = {
  name: "Your Protocol",
  shortName: "yours",
  ticker: "YRX",
  network: "Solana",
  contract: "...",
  features: { showNFTs: true, showStaking: true, showGovernance: true, showAnalytics: true },
  brand: { primary: "#8b5cf6", secondary: "#22d3ee", logo: "" },
};
```

Save, refresh. Done.

### Option C — Load a preset

The `presets/` folder has three ready-to-go JSON configs:
- `nexus-demo.json` — purple / cyan
- `chronos-demo.json` — pink / violet, ⏳ logo
- `vertex-demo.json` — green / cyan, 📈 logo

Open the admin panel → Import → pick any of them.

---

## Theme

- **Default**: light mode for first-time visitors
- **Toggle** in the header cycles `Auto → Light → Dark → Auto`
- Choice persists in `localStorage.nexus-theme`
- Pre-React script applies the saved theme before first paint to prevent FOUC

---

## API endpoints

| Source | Endpoint | Refresh | Free-tier limit | Purpose |
|---|---|---|---|---|
| CoinGecko | `/api/v3/coins/markets` | 30s | 30/min | Token prices, market cap, 7-day sparklines |
| CoinGecko NFTs | `/api/v3/nfts/list` | 60s | 30/min | Featured collection floor + 24h volume |
| solana.fm | `/v0/transfers/latest` | 15s | None published | Live Solana transfers |
| Solana RPC | `getSignaturesForAddress` | 15s | Public RPC fair-use | Activity fallback when solana.fm is 5xx |

Every fetch has try/catch + fallback. If a source is unreachable the relevant card shows a chip:

- 🟢 `Live · CoinGecko` / `Live · solana.fm` — fresh data
- 🔴 `Reconnecting` — last refresh failed, showing previous good data
- ⚪ `Sample data` — never reached the upstream, showing mock

---

## Deploy

### Vercel

```bash
vercel
# accept defaults
```

Vercel auto-detects this as a static project. The included `server.js` is only for local dev and is skipped by Vercel's static build. For a custom domain, configure it in the Vercel dashboard.

### Netlify

```bash
netlify deploy --dir=. --prod
```

Or drag-and-drop the project folder into Netlify's deploys page.

### GitHub Pages

Push to a repo → Settings → Pages → Source: `main` / root. Available at `https://<user>.github.io/<repo>/`.

### Cloudflare Pages / S3 / any static host

Upload `index.html`, `favicon.svg`, and (optionally) the `presets/` folder. No build command needed.

---

## CORS

All four upstream APIs serve CORS for browser fetches as of writing. If you deploy behind a corporate proxy or VPN that strips CORS headers, the fallback chain (Solana RPC → mock) keeps the UI working without a visible break.

---

## Mobile / responsiveness

- Sidebar → off-canvas drawer on `<lg` (1024px) with backdrop and body-scroll-lock
- Bottom tab bar on mobile (`<lg`)
- Marketplace filters → bottom sheet
- Tables hide non-essential columns at `sm` / `md` via Tailwind's `hidden sm:table-cell`
- Modals → bottom sheets on mobile, dialogs on desktop
- `viewport-fit=cover` + `env(safe-area-inset-bottom)` on the mobile tabs for iOS home indicator

---

## Browser support

Modern Chromium, Firefox, and Safari (last 2 years). The app uses:

- CSS `color-mix()`, `backdrop-filter`, CSS variables in `<stop-color>` — all evergreen-browser features
- ES2020+ syntax via Babel standalone (in-browser transpile — no build pipeline)
- `localStorage` for theme + brand config persistence

---

## Project structure

```
NEXUS-Protocol/
├── index.html          # the entire app — React, styles, mock data
├── server.js           # 30-line Node static server for local dev
├── favicon.svg         # the NEXUS "N" mark, theme-aware
├── presets/
│   ├── nexus-demo.json
│   ├── chronos-demo.json
│   └── vertex-demo.json
├── README.md
└── .gitignore
```

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Ctrl/Cmd + K` | Open search |
| `Ctrl/Cmd + Shift + K` | Open admin rebrand panel |
| `Esc` | Close any open modal |
