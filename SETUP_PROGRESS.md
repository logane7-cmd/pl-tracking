# Setup progress

Status tracker for getting the PL Tracker fully deployed. See `README.md` for the
full instructions each step refers to.

## Done

- [x] App scaffolded: `client/` (Vite + React + TS + Tailwind dashboard) and `worker/`
      (Cloudflare Worker proxy for football-data.org)
- [x] `client` builds and typechecks cleanly; UI logic sanity-checked against mock data
      (real browser check still pending — see below)
- [x] GitHub Actions workflow (`.github/workflows/deploy.yml`) added — builds `client/`
      and deploys to GitHub Pages on push to `main`
- [x] Repo created and pushed: https://github.com/logane7-cmd/pl-tracking (default branch `main`)
- [x] football-data.org API key obtained (not committed anywhere — will only live as a
      Cloudflare Worker secret)
- [ ] Cloudflare API token created (in progress — using an API token instead of
      `wrangler login` since this machine is being driven over SSH with no local browser
      for the OAuth callback)

## Not started yet

- [ ] Deploy the worker: set `FOOTBALL_DATA_API_KEY` secret, set `ALLOWED_ORIGIN` in
      `worker/wrangler.toml` to `https://logane7-cmd.github.io`, `npx wrangler deploy`
- [ ] Revoke/delete the Cloudflare API token once the worker deploy is confirmed working
      (not needed for ongoing operation, only for deploys)
- [ ] GitHub repo Settings → Pages → set source to "GitHub Actions"
- [ ] GitHub repo Settings → Secrets and variables → Actions → Variables → add
      `VITE_API_BASE_URL` = the deployed worker's `workers.dev` URL
- [ ] Trigger a deploy (push or re-run the Actions workflow) and confirm the site is live
      at `https://logane7-cmd.github.io/pl-tracking/`
- [ ] Actually view it in a browser and eyeball the four team cards (crest, standing,
      form, next/last match) — hasn't been visually verified yet, only checked via typecheck/build and mock-data logic review

## Notes for later

- Teams are configured in `client/src/config/teams.ts` — edit there to add/remove/rename.
- If a tracked team gets relegated to the Championship, football-data.org's free tier
  still covers it (`ELC` competition code) but the worker isn't wired to fetch from two
  competitions yet — would need a small change to `worker/src/index.ts`.
