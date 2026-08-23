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
