# Homelab Infrastructure Handoff

Reusable infrastructure patterns from this project (`financial-dashboard`) and its sibling
containers, written up for starting a **new** project on the same homelab without re-deriving any
of this. This file describes the *general* patterns; it is not specific to the financial dashboard
beyond using it as the worked example.

For the full current inventory of every container running on this machine (ports, volumes,
networks, known issues), see `P:\Docker\homelab_documentation\homelab-overview.md`. This doc is the
narrower "how do I bootstrap a new app" version of that.

---

## 1. Host environment

| Attribute | Value |
|---|---|
| Hostname | `FAMILYCOMP`, Windows 10 Pro, Docker Desktop + WSL2 |
| LAN IP | `192.168.1.7` |
| Tailscale FQDN | `familycomp.tailcde7b6.ts.net` (reachable from any device on the tailnet) |
| Tailscale IP | `100.106.42.97` |
| Container management | **Portainer** (`http://<host>:9000`), source of truth for what's actually deployed |
| App data drive | `P:\Docker\<project-name>\` — the convention for every project's compose file, source, and bind-mounted data |

Everything below assumes deploying as a **Portainer stack**, pointed at a GitHub repo, the same
way `financial-dashboard` is deployed. See §5.

---

## 2. Reusable services already running

### PostgreSQL (shared instance — don't spin up a new Postgres container)

- Stack: `postgres-stack`. Container: `postgres` (image `postgres:16`), port `5432`.
- Docker network: **`postgres-stack_postgres-network`** (external bridge network) — any new
  container that needs DB access joins this network and reaches Postgres by container name
  `postgres`, no host IP needed.
- Existing databases: `homelab`, `homelab_finance`, `peanuts`. **Create a new database** for a new
  project rather than reusing one of these — connect with `docker exec postgres psql -U postgres`
  and `CREATE DATABASE <new_db>;`.
- pgAdmin is available at port `5050` for browsing/managing whatever you create.
- Full data dictionaries for the existing databases live in
  `P:\Docker\homelab_documentation\<db-name>\DATA_DICTIONARY.md` — follow that convention for a new
  database's docs too (a new `homelab_documentation` subfolder + numbered migration `.sql` files,
  same as `homelab_finance/001_dashboard_schema.sql`).

### Tailscale (remote access — no reverse proxy needed for a simple case)

- Any container that publishes a host port is automatically reachable from any tailnet device at
  `http://familycomp.tailcde7b6.ts.net:<port>` — this is how `financial-dashboard` is accessed
  (`:3011`), no additional networking config required.
- Only reach for a reverse proxy (Caddy, see homelab-overview.md) if you need TLS termination or a
  clean hostname instead of a port — most projects here don't bother.

### Portainer + Watchtower auto-update

- Add the label `com.centurylinklabs.watchtower.enable=true` on the main service in your compose
  file (see `financial-dashboard`'s `docker-compose.yml`) to get automatic image updates for
  third-party base images. Not relevant for images you build yourself and don't push to a registry.

### Port allocation

Check `homelab-overview.md`'s Port Map before picking a host port — ports in the 3000s and other
low-thousands ranges are heavily used (3000 Grafana, 3003 Open WebUI, 3009 OpenSpeedTest, 3011
financial-dashboard, etc). Pick something unused and add it to that table when you deploy.

---

## 3. Pattern A — Node/Vite full-stack app (this project's pattern)

Use this when the new project is a web app with a UI. This is exactly how `financial-dashboard` is
built; copy the shape wholesale and swap the domain logic.

**Structure:**
```
project-root/
  client/          # Vite + React + TypeScript
  server/          # Node + Express + TypeScript
  Dockerfile       # multi-stage: client build -> server build -> runtime
  docker-compose.yml
  .env.example
```

**Client** (`client/package.json` scripts: `dev` = `vite`, `build` = `tsc -b && vite build`):
- Stack: Vite + React + TypeScript, Tailwind CSS, Recharts (if charts needed), Phosphor Icons,
  Motion for animation.
- `client/vite.config.ts` proxies `/api` to `http://localhost:3011` (or whatever port the server
  dev-runs on) — gives a working local full-stack setup without Docker: run `server/` with
  `npx tsx watch src/index.ts` on its port, and `client/` via `npx vite`, separately.

**Server** (`server/package.json` scripts: `dev` = `tsx watch src/index.ts`, `build` = `tsc -p
tsconfig.json`, `start` = `node dist/index.js`):
- Stack: Express + TypeScript, `pg` (node-postgres) with parameterized queries, `express-session` +
  `connect-pg-simple` for session storage in Postgres, `bcryptjs` for password hashing,
  `express-async-errors` for async route error handling.
- Auth pattern used here: a single shared username/password gate (no per-user accounts) —
  reasonable default for another small household/personal tool; build real per-user auth only if
  the new project actually needs multiple distinct identities.

**Dockerfile** (multi-stage, copy verbatim and adjust paths):
```dockerfile
# --- Client build ---
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Server build ---
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# --- Runtime ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json ./server/package.json
RUN cd server && npm install --omit=dev

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client-dist

EXPOSE <port>
CMD ["node", "server/dist/index.js"]
```
The server serves the built client as static files from `./client-dist` (see
`server/src/index.ts` in this repo for the static-file + SPA-fallback wiring).

**docker-compose.yml** (deployed as a Portainer stack, not run locally — see §5):
```yaml
services:
  <project-name>:
    build: .
    container_name: <project-name>
    restart: unless-stopped
    ports:
      - '<host-port>:<host-port>'
    environment:
      - TZ=America/Chicago
      - PORT=<host-port>
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - AUTH_USERNAME=${AUTH_USERNAME}
      - AUTH_PASSWORD_HASH=${AUTH_PASSWORD_HASH}
      - COOKIE_SECURE=${COOKIE_SECURE}
    networks:
      - postgres-network
    labels:
      - com.centurylinklabs.watchtower.enable=true

networks:
  postgres-network:
    name: postgres-stack_postgres-network
    external: true
```

**Local dev notes that generalize:**
- Keep a gitignored `.env` at repo root with real local credentials; commit only `.env.example`.
- `DATABASE_URL`'s host must be `postgres` for in-Docker use, but `localhost` when running the
  server outside Docker (Postgres is also published on the host at `localhost:5432`).
- If passing env vars through docker-compose interpolation, `$` in values (e.g. bcrypt hashes)
  needs doubling (`$$`) in the `.env` file; unescape to single `$` when passing the same value to a
  process run outside compose.

---

## 4. Pattern B — Python background job / scheduled script (no image build)

Use this for a scheduled job, sync script, or watcher that doesn't need a UI — no Dockerfile, no
image build step, just `python:3.11-slim` installing deps at container start. Two existing examples
to copy from: `P:\Docker\notion-postgres-sync\` (scheduled sync job) and the `bookvoice-whisper`
service in `P:\Docker\BookVoice\docker-compose.yml` (file-watcher).

**Why this pattern:** it sidesteps the broken `docker-credential-desktop.exe` CLI build issue
entirely (see §6) — there's no `docker build` step, so Portainer just pulls the stock
`python:3.11-slim` image and runs your script directly from a bind mount.

**Structure:**
```
P:\Docker\<project-name>\
  docker-compose.yml
  requirements.txt
  .env / .env.example
  scripts/
    main.py (or run_scheduler.py, watcher.py, etc.)
```

**docker-compose.yml** (`notion-postgres-sync`'s, as the cleaner of the two examples):
```yaml
services:
  <project-name>:
    image: python:3.11-slim
    container_name: <project-name>
    restart: unless-stopped
    networks:
      - postgres-network        # omit if the job doesn't need DB access
    volumes:
      - P:/Docker/<project-name>/scripts:/app
      - P:/Docker/<project-name>/requirements.txt:/app/requirements.txt
    working_dir: /app
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - TZ=America/Chicago
    command: >
      sh -c "pip install --quiet -r requirements.txt &&
             python -u run_scheduler.py"

networks:
  postgres-network:
    external: true
    name: postgres-stack_postgres-network
```

- Editing the script on the host and restarting the container picks up changes immediately — no
  rebuild, since it's a bind mount plus a fresh `pip install` on every container start.
  `bookvoice-whisper` uses the same shape but without a `requirements.txt` file — it installs its
  two deps (`faster-whisper watchdog`) inline in the `command:`.
- If the job needs a persistent model cache or other large downloaded state, bind-mount a dedicated
  folder for it (see `whisper-models/` mounted at `/root/.cache/huggingface` in BookVoice) so it
  survives container restarts instead of re-downloading.

---

## 5. Deployment workflow (Portainer, both patterns)

1. Push the project to its own GitHub repo (`financial-dashboard`'s is
   `https://github.com/logane7-cmd/financial-dashboard`).
2. In Portainer: **Stacks → Add stack → Repository** build method, pointed at the repo. Do **not**
   use Upload/Web-editor for Pattern A — those don't accept the surrounding `Dockerfile` +
   `client/`/`server/` source that a `build: .` compose needs. Pattern B (no build step) can use
   Upload/Web-editor just as easily since there's nothing to build.
3. Set env vars directly in the Portainer stack's environment fields — never a committed `.env`.
4. Deploy. Portainer talks to the Docker Engine API directly, so it's unaffected by the CLI build
   issue below.

---

## 6. Known host-level gotcha: `docker compose build` is broken from the CLI

`docker compose build` / `docker buildx` run from the Windows CLI fail at the image-pull step with:
```
error getting credentials - err: exit status 1, out: "A specified logon session does not exist..."
```
This is a Windows Credential Manager / logon-session issue
(`ERROR_NO_SUCH_LOGON_SESSION`) with `docker-credential-desktop.exe`, not a Docker or project config
problem — confirmed by `docker-credential-desktop.exe list` reproducing the same error standalone.
Not yet resolved as of this writing (would likely need `wsl --shutdown` + Docker Desktop relaunch,
or a Windows sign-out/reboot).

**Implication for any new project:** don't try to `docker compose build` locally to test the image.
Either:
- Use Pattern B (no build step at all), or
- For Pattern A, test the app locally by running `client/` and `server/` directly with
  `npx vite` / `npx tsx watch` (no Docker involved), and let Portainer do the actual image build on
  deploy.

Full diagnosis history: `P:\Docker\homelab_documentation\homelab-overview.md` (Known Issues
section) and `docs/plans/financial-dashboard.md` in this repo.

---

## 7. Quick checklist for a new project

- [ ] Pick a project name and reserve a host port (check `homelab-overview.md`'s Port Map).
- [ ] Decide Pattern A (has a UI) vs Pattern B (background job only).
- [ ] `P:\Docker\<project-name>\` for data/scripts; separate GitHub repo for source, following this
      project's `.gitignore` conventions (`.env`, `node_modules`, build output).
- [ ] If it needs a database: `CREATE DATABASE` on the existing `postgres` container, join
      `postgres-stack_postgres-network`, don't spin up a new Postgres.
- [ ] `.env.example` committed, real `.env` gitignored.
- [ ] Deploy via Portainer **Repository** stack method (Pattern A) or Upload (Pattern B).
- [ ] Add the new service to `homelab-overview.md`'s Port Map and Services section once deployed.
