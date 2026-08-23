# PL Tracker

A tiny dashboard tracking four friends' Premier League teams: standings position, form,
last result, and next fixture, with a live banner while a match is in progress.

- **Tottenham Hotspur** — Logan
- **Aston Villa** — Kathleen
- **Nottingham Forest** — David
- **Ipswich Town** — Sam

## How it's built

- `client/` — static React + Vite + Tailwind site, deployed to **GitHub Pages** via
  `.github/workflows/deploy.yml`. Polls for fresh data every 60 seconds.
- `worker/` — a small **Cloudflare Worker** that proxies [football-data.org](https://www.football-data.org/)'s
  free API. It holds the API key as a secret (never shipped to the browser) and adds the
  CORS header GitHub Pages needs. football-data.org's own docs say not to embed the key
  in client-side JS, hence the proxy.

Two upstream calls per refresh (standings + a matches window), well under
football-data.org's free-tier limit of 10 requests/minute.

## One-time setup

### 1. Get a free football-data.org API key

Register at <https://www.football-data.org/client/register> (free tier). You'll get an
API token by email.

### 2. Deploy the worker proxy

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put FOOTBALL_DATA_API_KEY   # paste the token from step 1
```

Edit `worker/wrangler.toml` and set `ALLOWED_ORIGIN` to your GitHub Pages origin, e.g.
`https://your-github-username.github.io` (no trailing slash, no repo path).

```bash
npx wrangler deploy
```

This prints a URL like `https://pl-tracking-proxy.<your-subdomain>.workers.dev` — that's
your `VITE_API_BASE_URL`.

### 3. Push this repo to GitHub

Create a repo (this project assumes it's named `pl-tracking` — if not, update `base` in
`client/vite.config.ts` to match), then push.

### 4. Configure GitHub Pages + the API base URL

- **Settings → Pages → Source: GitHub Actions**
- **Settings → Secrets and variables → Actions → Variables** → add
  `VITE_API_BASE_URL` = the workers.dev URL from step 2 (it's not secret, just the proxy's
  public address).

Push to `main` (or run the workflow manually) and the site deploys to
`https://<your-github-username>.github.io/pl-tracking/`.

## Local development

```bash
cd client
cp .env.example .env.local   # edit VITE_API_BASE_URL to point at your deployed worker
npm install
npm run dev
```

To run the worker locally instead: `cd worker && npx wrangler dev` (create a
`worker/.dev.vars` file with `FOOTBALL_DATA_API_KEY=...` for local testing), then point
`VITE_API_BASE_URL` at `http://localhost:8787`.

## Changing the teams

Edit `client/src/config/teams.ts`. Each entry needs a display name, owner, one or more
substrings to match the team against football-data.org's team names, and a brand color.

## Known limitations

- football-data.org's free tier only covers 12 competitions (Premier League and
  Championship among them, so a relegated team would still show up if you re-point
  `worker/src/index.ts` at `ELC` for that team — not wired up automatically).
- Scores are delayed a little, not truly live — the 60-second poll is the practical
  ceiling on the free tier.
