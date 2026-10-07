# AWS Deployment Plan — System Design Studio (Jenkins CI/CD)

> **Project 1 of 2.** Deploy this one **first**.
> Sister plan: `Enterprise-knowledge-copilot/AWS-DEPLOYMENT-PLAN.md` (deploys second, uses GitHub Actions).
>
> **Status:** Not started — update the Progress Tracker (Section 10).
> **Owner:** Kishor (kishorr21cse@gmail.com) · **Created:** 2026-09-29 · **Facts verified:** 2026-09-29

---

## 0. How to use this document

Self-contained execution plan. Written after a full analysis of this codebase — **you do not need to re-explore the repo to begin.** Section 1 has every fact you need.

**Rules for the executing agent:**

1. **Work phase by phase, in order.** Each depends on the previous.
2. **Update the Progress Tracker** (Section 10) after each phase. Record blockers there.
3. **Verify before relying.** Accurate as of 2026-09-29. If a path or line number doesn't match, trust the repo and correct this doc.
4. **Never invent AWS costs or Free Tier rules.** Section 3 has verified numbers. Anything else — say you need to check.
5. **The user is an AWS beginner.** Explain *why*, not just *what*. Don't assume they know what a VPC, subnet, or security group is.
6. **Phases 1–2 are AWS console work the user must do themselves.** Your job is precise guidance. From Phase 3 on, you write real files.
7. **All code here is a starting template, not verified output.** Build it, run it, fix what breaks. Don't claim it works until you've seen it work.
8. **Secrets never enter git** — not in Dockerfiles, compose files, or the Jenkinsfile.
9. **Don't commit or push unless the user asks.**

**Also read:** `README.md` (architecture + deliberate trade-offs, written by the user), `CLAUDE.md`, `AGENTS.md`.

**Phases 1, 2, 4, 5, 8 build shared infrastructure** that the copilot project reuses. Do them properly once.

---

## 1. Project facts

| Fact | Value |
|---|---|
| Repo | `github.com/KishorKumar07/System-Design-Studio`, branch **`master`** |
| Path | `E:\Kishor\Projects\Enterprise-knowledge-copilot\System-Design-Studio` |
| Note | Nested inside the copilot folder but is **its own git repo** — that's why the parent's `git status` looks clean |
| Commits | 5, last 2026-08-21 |
| Stack | **Single Next.js 16 monolith** — App Router, React 19.2.8, TypeScript 5, Tailwind v4 |
| API | 9 route handlers under `src/app/api/` — **no separate backend process** |
| Database | PostgreSQL via **Prisma 6.12**, 8 models, **1 migration** (`prisma/migrations/20260819163425_init/`) |
| Auth | **Auth.js v5** (`next-auth@5.0.0-beta.32`), JWT strategy, GitHub OAuth + credentials (bcryptjs) |
| Route guard | `src/proxy.ts` (Next 16's renamed middleware) protects `/dashboard`, `/designs`, `/account`, `/problems` |
| LLM | Gemini `gemini-3.6-flash` → Groq `llama-3.3-70b-versatile` fallback → deterministic scorer |
| Tests | **Vitest, 6 files, 29 cases** |
| CI today | `.github/workflows/ci.yml` — lint + typecheck + test, **no CD** |
| Docker today | **None** — no Dockerfile, no compose file |
| Port | 3000 |
| Image size | ~552 MB, build-verified (standalone output; heavier than a bare estimate because the Prisma CLI + native engine binaries are included for `migrate deploy`) |
| RAM needed | ~512 MB |
| Completeness | **Finished.** Zero TODOs, 67 source files, ~3,900 lines |

**Key source files:**
- `src/lib/ai/client.ts` — provider fallback, 30s per-call timeout, **worst case ~180s total**, pricing constants
- `src/lib/ai/evaluate.ts` — orchestrator
- `src/lib/security/rateLimit.ts` — DB-backed sliding window, default 10/hour
- `src/lib/security/authz.ts` — `requireDesignOwner` ownership checks
- `src/lib/db/prisma.ts` — plain `new PrismaClient()`, **no connection pooler**
- `next.config.ts` — pins `turbopack.root`, wraps `withSentryConfig`, **no `output: "standalone"`**

**npm scripts:** `dev`, `build`, `start`, `lint`, `test` (vitest run), `typecheck` (tsc --noEmit), `postinstall` (prisma generate), `db:migrate` (**`prisma migrate dev` — DANGEROUS in prod**), `db:seed`, `db:studio`

**Environment variables (13 total, 3 mandatory):**

| Variable | Required | Where |
|---|---|---|
| `DATABASE_URL` | **Yes** | `prisma/schema.prisma:7` |
| `AUTH_SECRET` | **Yes** | Auth.js implicit |
| `GEMINI_API_KEY` | **Yes** | `src/lib/ai/client.ts:47` |
| `AUTH_URL` | **Yes in prod** | Auth.js — required behind a reverse proxy |
| `GROQ_API_KEY` | Recommended | `src/lib/ai/client.ts:53` |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | Optional | `src/lib/auth.ts:17-18` |
| `EVAL_RATE_LIMIT_PER_HOUR` | Optional (default 10) | `src/lib/security/rateLimit.ts:3` |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Optional | sentry configs |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Optional | `next.config.ts:18-20` |

**Known inconsistency:** README says local Postgres on host port **5434**; `.env.example` says **5432**. Pick one and fix the other.

---

## 2. Locked decisions

Decided with the user. **Do not re-litigate.**

| Decision | Choice | Reason |
|---|---|---|
| **Deploy order** | **This project first** | 3-min builds vs the copilot's 20-min; 1 service vs 3; 3 secrets vs 13 |
| **CI/CD here** | **Jenkins**, self-hosted on EC2 | Light 200 MB build fits a 2 GB Jenkins box |
| **CI/CD for the copilot** | GitHub Actions | Its 2 GB PyTorch build would OOM a 2 GB Jenkins box; GH runners have 16 GB |
| **Compute** | One `t3.small` app server + one `t3.small` Jenkins | An ALB alone is $16/mo — kills the budget |
| **Database** | **Postgres in Docker** on the app server, image `pgvector/pgvector:pg16`, two databases | RDS adds ~$15/mo for no benefit at this scale |
| **Not using** | ECS, Fargate, ALB, RDS, Lambda, Amplify | Cost — see Section 3 |
| **Domain** | **DuckDNS** free subdomain + Let's Encrypt | User doesn't want to buy a domain |
| **TLS** | Nginx on the host, not containerised | Simpler certbot renewal |
| **Region** | `ap-south-1` (Mumbai) | User is in India; ~10% above the cheapest US region |
| **Budget** | Free-tier credits only | User explicitly asked for near-zero cost |

**Why Postgres uses the pgvector image even though this app doesn't need vectors:** the copilot project shares this same container later and *does* need the extension. Setting it up now avoids a migration.

**Why Jenkins gets this project:** Jenkins runs on a 2 GB instance you pay for. This app's 200 MB Node build fits comfortably; the copilot's 2 GB PyTorch build would not. Match the build to the executor's resources.

---

## 3. Cost model (verified 2026-09-29)

**AWS changed the Free Tier on 15 July 2025.** Older guides are wrong.

A new account gets **$100 credit at signup + up to $100 more** for onboarding activities (**$200 max**), lasting **6 months** or until spent. The old "750 free hours of t2.micro for 12 months" **does not apply to new accounts**.

So "free" = **keep usage under ~$33/month**.

| Resource | Monthly |
|---|---|
| App server `t3.small` (2 GB) 24/7 | ~$15.20 |
| App server 30 GB gp3 | ~$2.40 (billed even when stopped) |
| Elastic IP | ~$3.65 (AWS bills all public IPv4 since Feb 2024) |
| Jenkins `t3.small`, ~80 hrs/mo | ~$3–5 (stopped when not deploying) |
| Jenkins 20 GB gp3 | ~$1.60 |
| ECR storage | ~$0.30 (with a 10-image lifecycle policy) |
| Data transfer out | ~$1 |
| **Total** | **~$28/mo → ~$168 over 6 months** |

**Biggest lever:** stopping the app server between demos drops the total to **~$4/month**.

---

## 4. Target architecture (this project's slice)

```
  Laptop ──git push──▶ GitHub ──webhook──▶ JENKINS (EC2 t3.small)
                                            │  AWS auth: IAM instance role
                                            │  checkout → npm ci → lint
                                            │  → typecheck → vitest
                                            │  → docker build
                                            ├──push──▶ Amazon ECR
                                            │           (system-design-studio)
                                            └──ssh deploy──┐
                                                           ▼
                        ┌──────────────────────────────────────────┐
                        │ APP SERVER (EC2 t3.small)                │
                        │ ┌──────────────────────────────────────┐ │
                        │ │ Nginx :80/:443  Let's Encrypt TLS    │ │
                        │ │ proxy_read_timeout 300s              │ │
                        │ └──────────────┬───────────────────────┘ │
                        │         ┌──────▼──────┐                  │
                        │         │  SDS :3000  │ (pulled from ECR)│
                        │         └──────┬──────┘                  │
                        │      ┌─────────▼──────────┐              │
                        │      │ Postgres 16        │              │
                        │      │ + pgvector         │              │
                        │      │ named volume       │              │
                        │      │ 2 DBs (1 for EKC)  │              │
                        │      └────────────────────┘              │
                        └──────────────────────────────────────────┘
                                          │
                              Gemini · Groq (external, free tiers)
```

**Why the app server never builds:** it only runs `docker pull`. Deploys take seconds, and a broken build can never reach production.

---

# PHASES

---

## Phase 1 — AWS account and spending guardrails  *(shared foundation)*

**Goal:** an account that cannot surprise you with a bill.
**Time:** ~45 min · **Cost:** $0 · **Who:** the user, in the AWS web console

### 1.1 Sign up
1. `aws.amazon.com` → **Create an AWS Account**. Email + account name (`kishor-personal`) becomes the **root user**.
2. **Card required** even on the free plan. It charges ~₹2 and refunds it. Some RuPay cards are rejected — Visa/Mastercard is safest.
3. Verify phone via SMS.
4. **Choose the Free plan**, not Paid — it hard-caps spend at the credit balance.
5. **Basic support** (free).

### 1.2 Secure root immediately
Root can delete everything and cannot be restricted. IAM → **add MFA to the root user** (Google/Microsoft Authenticator).
*Leaked AWS root credentials are found by bots within minutes and used to mine crypto on the user's card. This is not hypothetical.*

### 1.3 Daily-use IAM user
IAM → **Users** → **Create user** `kishor-admin` → console access → attach **`AdministratorAccess`** → enable MFA. Save the sign-in URL.
**Log out of root. Use `kishor-admin` from now on.** Root is only for billing and account closure.

### 1.4 Billing guardrails — the most important step here
1. **Billing and Cost Management** → **Billing preferences** → enable Free Tier alerts + PDF invoices
2. **Budgets** → **Create budget** → **Zero spend budget** template → user's email
3. Second budget: **Monthly cost budget $30**, alerts at 50% / 80% / 100%
4. **Credits** → confirm the $100 landed; find the "earn $100 more" activities

### 1.5 Region
Set **`ap-south-1` (Mumbai)** top-right. **Never change it** — resources in one region are invisible in another. This confuses every beginner at least once.

**Exit criteria:** root has MFA · `kishor-admin` exists with MFA · two budgets armed · region is ap-south-1 · credits confirmed

---

## Phase 2 — The 8 concepts you actually need  *(shared foundation)*

**Time:** ~1 hr reading · **Cost:** $0

| Concept | Plain English | Analogy |
|---|---|---|
| **Region / AZ** | A city with AWS data centres / separate buildings in it | Mumbai / buildings in it |
| **EC2** | A rented Linux computer | A PC rented by the hour |
| **EBS** | The disk attached to it | The SSD inside that PC |
| **VPC / Subnet** | Your private network inside AWS | The office building |
| **Security Group** | Firewall listing which ports the world may reach | The guard at the door |
| **Key Pair** | SSH key proving it's you | The physical key |
| **IAM** | Who may do what | HR access badges |
| **ECR** | AWS's private Docker registry | A private Docker Hub |

**Mental model:** rent a computer (EC2), give it a disk (EBS), put it in a network (VPC), open only 22/80/443 (Security Group), log in with a key (Key Pair), pull images from a private registry (ECR).

Everything else is Linux and Docker — which the user already does locally.

---

## Phase 3 — Make this project deployable

**Goal:** `docker compose up` runs the whole app locally.
**Time:** ~2 hrs · **Cost:** $0 · **Where:** the laptop, in this repo

This repo has **no Dockerfile and no compose file** — it's shaped for Vercel. That's the gap.

### 3.1 Edit `next.config.ts`

Add `output: "standalone"` to the existing config. **Keep** `turbopack.root` and the `withSentryConfig` wrapper.

Without standalone output the runtime image needs all of `node_modules` (~700 MB). With it, Next emits a self-contained server and the image drops to ~200 MB. **On a 2 GB server this matters.**

### 3.2 Add a `db:deploy` script to `package.json`

```json
"db:deploy": "prisma migrate deploy"
```

**Critical:** `db:migrate` is `prisma migrate dev` — interactive, and **it can reset the database**. Never run it in production. Production uses `migrate deploy`, which currently exists nowhere in this repo.

### 3.3 `Dockerfile` — ✅ created and build-verified

**Status: done.** `Dockerfile` exists in this repo and has been built and run end-to-end (image builds, container boots, connects to Postgres, migrations apply, seed runs, signup/login/problems API all return correctly through real HTTP requests against the built image).

Three real failures were hit and fixed while verifying it — **do not "simplify" these back out**, they are not defensive over-engineering:

1. **`Cannot find module '@prisma/engines'`** — cherry-picking only `node_modules/@prisma/client` into the runtime stage is not enough; the `prisma` CLI (needed for `migrate deploy`) transitively needs `@prisma/engines`, `@prisma/fetch-engine`, `@prisma/get-platform`, `@prisma/debug`, `@prisma/config`. **Fix:** copy the whole `node_modules/@prisma` scope, not individual sub-packages — this also survives future Prisma version bumps that add/rename internal packages.
2. **`ENOENT: prisma_schema_build_bg.wasm`** — `node_modules/.bin/prisma` is a symlink to `../prisma/build/index.js`. Its bundled loader resolves sibling asset files relative to wherever it physically executes, and Docker's `COPY` does not reliably preserve that relationship across the symlink. **Fix:** don't rely on the `.bin` shim at all — `package.json`'s `db:deploy` script calls the real entry file directly: `node node_modules/prisma/build/index.js migrate deploy`.
3. **`tsx: not found` running `db:seed`** — `tsx` is a devDependency, correctly absent from the slim runtime image. **Fix is not to add it to the runtime image** (that would defeat the point of standalone output) — seed from the `builder` stage instead, as a one-time operation. See Phase 7.5.

Full annotated file: `System-Design-Studio/Dockerfile`. Verified image size: **~552 MB** (higher than a bare `next build` estimate of ~200 MB, because the `prisma` CLI and its native query-engine binaries add real weight — still comfortable on a 2 GB instance).

### 3.4 `.dockerignore` — ✅ created

`System-Design-Studio/.dockerignore`. Excludes `node_modules`, `.next`, `.git`, `.github`, all `.env*` except `.env.example`, and the repo's own markdown docs (`README.md`, `AGENTS.md`, `CLAUDE.md`, this plan file).

### 3.5 `docker-compose.yml` — ✅ created and verified

`System-Design-Studio/docker-compose.yml`. Two services:
- **`postgres`** — image **`pgvector/pgvector:pg16`** (matches production, and what the sister copilot project needs later), named volume `sds_postgres_data`, `pg_isready` healthcheck, host port `5434:5432` to match the README's documented local-dev convention
- **`app`** — builds from the `Dockerfile`, waits on postgres healthy, reads `.env.docker` (gitignored — copy from `.env.example` and fill in real values), port `3000:3000`. `DATABASE_URL` is overridden in the compose file itself to point at the `postgres` service name, since `.env.docker`'s copy of `DATABASE_URL` is for host-side `next dev`, not container-to-container networking.

**Fixed while verifying:** `.env.example`'s `DATABASE_URL` said port 5432, but the README's documented `docker run` command maps host port 5434. Corrected `.env.example` to 5434 so following the README's own instructions actually works.

### 3.6 Production environment values

| Variable | Production value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://sds:<pw>@postgres:5432/system_design_studio` | host = the **Docker service name**, not localhost |
| `AUTH_SECRET` | `openssl rand -base64 32` | never reuse the dev value |
| `AUTH_URL` | `https://<duckdns-name>` | **Auth.js v5 needs this behind a proxy or callbacks break** |
| `GEMINI_API_KEY` | user's key | free tier, no AWS cost |
| `GROQ_API_KEY` | user's key | fallback provider |
| `EVAL_RATE_LIMIT_PER_HOUR` | `5` | lower than the default 10 — protects the LLM quota on a public URL |
| `AUTH_GITHUB_ID` / `_SECRET` | optional | callback URL must be updated in GitHub |
| `SENTRY_DSN` | optional | inert if unset |

### 3.7 Verify locally — ✅ partially done, one thing left for you

**Already verified in this session** (real `docker compose up --build`, real HTTP requests against the built image, no shortcuts):
- ✅ Image builds clean (~552 MB)
- ✅ Both containers start; Postgres healthcheck passes before the app starts
- ✅ `npm run db:deploy` applies the migration inside the container
- ✅ `npm run db:seed` (run from the `builder` stage — see Phase 7.5) seeds all 6 problems
- ✅ `POST /api/auth/register` returns `201` with a real user record
- ✅ `GET /api/problems` returns all 6 seeded problems
- ✅ `GET /login` renders (`200`)
- ✅ `GET /api/auth/csrf` returns a token (Auth.js is wired up correctly)

**Not yet verified — needs real API keys, which this session doesn't have:**
- ☐ Create a design on the canvas, save, reload → persists
- ☐ Submit an evaluation with a real `GEMINI_API_KEY` → scores return (allow up to 80s)
- ☐ Confirm the Groq fallback triggers if you temporarily break the Gemini key
- ☐ Full browser login flow (cookie set correctly, `/dashboard` accessible after login)

Run these once you have `GEMINI_API_KEY` / `GROQ_API_KEY` in `.env.docker`:

```bash
docker compose up -d --build
docker compose exec -e DATABASE_URL=postgresql://sds:devpass@postgres:5432/system_design_studio app npm run db:deploy
docker build --target builder -t sds-builder:latest .
docker run --rm --network system-design-studio_default \
  -e DATABASE_URL=postgresql://sds:devpass@postgres:5432/system_design_studio \
  sds-builder:latest npm run db:seed
docker rmi sds-builder:latest
```
Then open `http://localhost:3000` in a browser and do the rest by hand — canvas and evaluation are genuinely easier to check visually than via curl.

**If it doesn't work on the laptop, it will not work on AWS** — and debugging over SSH is ten times harder.

**Exit criteria:** ✅ image builds · ✅ container starts · ✅ migrations apply · ✅ seed runs · ✅ signup works · ☐ a design saves · ☐ an evaluation returns scores

---

## Phase 4 — Launch the app server  *(shared foundation)*

**Goal:** a Linux box on the internet, reachable by SSH.
**Time:** ~45 min · **Cost:** starts the ~$21/month meter

### 4.1 Key pair — first
EC2 → **Key Pairs** → **Create** → name `ekc-key`, type RSA, format **`.pem`**.
**It downloads once and can never be re-downloaded.** Save to `C:\Users\HP\.ssh\ekc-key.pem`.

### 4.2 Launch

| Setting | Value | Why |
|---|---|---|
| Name | `apps-prod` | |
| AMI | **Amazon Linux 2023** | free, AWS-maintained, Docker installs cleanly |
| Type | **`t3.small`** (2 vCPU, 2 GB) | `t3.micro`'s 1 GB cannot hold the copilot later |
| Key pair | `ekc-key` | |
| Network | Default VPC, **auto-assign public IP = Enable** | |
| Security group | new, `apps-sg` | see below |
| Storage | **30 GB gp3** | the copilot's 2 GB image + Postgres; the default 8 GB fills up |

**Inbound rules for `apps-sg`:**

| Port | Source | Why |
|---|---|---|
| 22 | **My IP** | never `0.0.0.0/0` — bots brute-force 22 constantly |
| 80 | `0.0.0.0/0` | Let's Encrypt validation, then redirect to HTTPS |
| 443 | `0.0.0.0/0` | the app |

Later (Phase 6): add **port 22 from the Jenkins security group**.

**Do not open 5432 or 3000.** Those talk over Docker's internal network. Being able to explain *why* is a genuine interview differentiator.

### 4.3 Elastic IP
Without one the public IP **changes on every stop/start**, breaking DNS and OAuth redirects each time.
EC2 → **Elastic IPs** → **Allocate** → **Associate** with `apps-prod`.

> An Elastic IP **not attached to a running instance** is billed at a higher rate. Release it during long breaks.

### 4.4 Prepare the box

```bash
ssh -i ~/.ssh/ekc-key.pem ec2-user@<elastic-ip>
```

1. `sudo dnf update -y`
2. Install Docker + Compose plugin; `sudo systemctl enable --now docker`; add `ec2-user` to the `docker` group; **log out and back in**
3. Install `git`
4. **Create a 4 GB swap file.** With 2 GB RAM, Postgres spikes (and PyTorch later, for the copilot) trigger the kernel OOM killer. Swap turns a hard crash into a brief slowdown. This is the difference between "it works" and a wasted afternoon.

**Exit criteria:** SSH works · `docker run hello-world` works · `free -h` shows 4 GB swap · Elastic IP attached

---

## Phase 5 — Free domain and free HTTPS  *(shared foundation)*

**Goal:** a real padlock. **Time:** ~30 min · **Cost:** $0

**A raw IP cannot have an HTTPS certificate.** And Auth.js refuses to set secure session cookies over plain HTTP. So you need a name.

1. **duckdns.org** → sign in with GitHub → claim e.g. `kishor-apps.duckdns.org` → point it at the Elastic IP. Free and permanent.
2. Install **Nginx on the host** (not in a container — simpler cert renewal), reverse-proxying to `localhost:3000`.
3. **Certbot** → free Let's Encrypt cert → **verify auto-renewal is scheduled**. Certs expire every 90 days; an expired cert takes the whole site down.
4. Nginx settings that matter:

```nginx
# Evaluations run 10-80s, worst case ~180s (src/lib/ai/client.ts).
# Nginx's 60s default would cut them off and produce mysterious 504s.
proxy_read_timeout 300s;
proxy_connect_timeout 75s;

# Auth.js needs these to build correct callback URLs behind a proxy
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

5. If using GitHub OAuth, update the callback to `https://<duckdns-name>/api/auth/callback/github`.

**Exit criteria:** `https://<name>` serves the app · padlock valid · HTTP redirects to HTTPS · `certbot renew --dry-run` passes

---

## Phase 6 — Jenkins CI/CD

**Goal:** `git push` → build, test, push to ECR, deploy.
**Time:** 4–6 hrs (the biggest learning phase) · **Cost:** ~$3–5/month

### 6.0 Decide what happens to the existing GitHub Actions workflow

This repo already has `.github/workflows/ci.yml` (lint + typecheck + test). Two sane options:

- **Keep it as a PR gate, give Jenkins the deploy** *(recommended)* — Actions checks pull requests, Jenkins builds and ships from `master`. Common in real teams, and you never push a broken branch.
- **Retire it** and let Jenkins own everything. Simpler story, one place to look.

Either is defensible. Just be able to say which and why.

### 6.1 Why Jenkins gets its own server

Builds are CPU- and RAM-heavy. On the app server, every deploy would degrade the live site, and a build that OOMs would take production down with it. **Separating build from runtime is the point.**

### 6.2 Launch the Jenkins box

| Setting | Value |
|---|---|
| Name | `jenkins` |
| AMI | Amazon Linux 2023 |
| Type | **`t3.small`** — Jenkins is a JVM app; 1 GB will thrash |
| Storage | **20 GB gp3** |
| Security group | `jenkins-sg`: 22 from **My IP**, 8080 from **My IP** |

**Never expose 8080 to `0.0.0.0/0`.** Publicly reachable Jenkins is among the most actively exploited things on the internet. Use an SSH tunnel:

```bash
ssh -i ~/.ssh/ekc-key.pem -L 8080:localhost:8080 ec2-user@<jenkins-ip>
# then open http://localhost:8080 on the laptop
```

Install Java 17, Jenkins, Docker, git, AWS CLI. Add the `jenkins` user to the `docker` group. Unlock with `/var/lib/jenkins/secrets/initialAdminPassword`.

**Plugins:** Pipeline, Git, GitHub, Docker Pipeline, Credentials Binding, Amazon ECR, SSH Agent, Pipeline: Stage View, Blue Ocean.

### 6.3 Credentials and access

**Jenkins → AWS: use an IAM instance role, not access keys.** Create a role with `AmazonEC2ContainerRegistryPowerUser`, attach it to the Jenkins instance. Jenkins then authenticates with **no credentials on disk**.
*Interview value: "I used instance roles so no long-lived AWS keys ever existed."*

**Jenkins → app server:**
- In `apps-sg`, allow port 22 **from the `jenkins-sg` security group** (reference the SG, not an IP — it survives IP changes)
- Store the SSH private key in Jenkins as **SSH Username with private key** (id e.g. `app-server-ssh`)
- Use the `sshagent` step

**App secrets:** store `GEMINI_API_KEY`, `GROQ_API_KEY`, `AUTH_SECRET`, `DATABASE_URL` as Jenkins **Secret text** credentials. Bind with `withCredentials` so they're masked in logs. **Never in the Jenkinsfile.**

### 6.4 ECR repository
ECR → **Create repository** → private → `system-design-studio`.
Add a **lifecycle policy: keep the last 10 images.** Otherwise old layers accumulate and cost money for nothing.

### 6.5 `Jenkinsfile`

Template — 8 stages:

```groovy
pipeline {
  agent any

  environment {
    AWS_REGION   = 'ap-south-1'
    ECR_REGISTRY = '<account-id>.dkr.ecr.ap-south-1.amazonaws.com'
    ECR_REPO     = 'system-design-studio'
    IMAGE_TAG    = "${env.GIT_COMMIT.take(7)}"
    APP_HOST     = 'ec2-user@<elastic-ip>'
    PUBLIC_URL   = 'https://<duckdns-name>'
  }

  options {
    timeout(time: 20, unit: 'MINUTES')
    disableConcurrentBuilds()   // two deploys racing on one DB is a bad afternoon
  }

  stages {
    stage('Checkout')  { steps { checkout scm } }
    stage('Install')   { steps { sh 'npm ci' } }          // ci, not install — reproducible
    stage('Lint')      { steps { sh 'npm run lint' } }
    stage('Typecheck') { steps { sh 'npm run typecheck' } }
    stage('Test')      { steps { sh 'npm run test' } }    // 29 Vitest cases

    stage('Build image') {
      steps { sh "docker build -t ${ECR_REPO}:${IMAGE_TAG} ." }
    }

    stage('Push to ECR') {
      steps {
        sh """
          aws ecr get-login-password --region ${AWS_REGION} \
            | docker login --username AWS --password-stdin ${ECR_REGISTRY}
          docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
          docker tag ${ECR_REPO}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPO}:latest
          docker push ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
          docker push ${ECR_REGISTRY}/${ECR_REPO}:latest
        """
      }
    }

    stage('Deploy') {
      steps {
        sshagent(['app-server-ssh']) {
          sh """
            ssh -o StrictHostKeyChecking=accept-new ${APP_HOST} '
              set -e
              aws ecr get-login-password --region ${AWS_REGION} \
                | docker login --username AWS --password-stdin ${ECR_REGISTRY}
              docker pull ${ECR_REGISTRY}/${ECR_REPO}:${IMAGE_TAG}
              cd /opt/apps/sds
              export IMAGE_TAG=${IMAGE_TAG}
              docker compose run --rm app npm run db:deploy   # migrations: DISCRETE step
              docker compose up -d app
            '
          """
        }
      }
    }

    stage('Health check') {
      steps {
        sh """
          for i in \$(seq 1 10); do
            if curl -fsS ${PUBLIC_URL}/ > /dev/null; then echo OK; exit 0; fi
            sleep 6
          done
          echo "Health check failed"; exit 1
        """
      }
    }
  }

  post {
    failure { echo 'Build failed — production untouched.' }
    always  { sh 'docker image prune -f || true' }
  }
}
```

**What separates a real pipeline from a toy one:**
- **Tag by git SHA, never only `latest`.** Without a SHA tag you cannot roll back and cannot tell which commit is live.
- **Migrations as their own step**, before swapping the container — never in the container's `CMD`, which races on restart.
- **End with a health check.** A deploy that doesn't verify isn't a deploy.
- **`disableConcurrentBuilds()`**.

**Trigger:** GitHub webhook → `http://<jenkins-ip>:8080/github-webhook/` (needs 8080 open to GitHub's IP ranges). To keep 8080 fully private, use `pollSCM('H/5 * * * *')` instead — less elegant, much smaller attack surface.

### 6.6 Keep Jenkins cheap
**Stop the instance when not developing.** Stopped = $0 compute, ~$1.60/month disk.
Trade-off: webhooks won't fire while it's off — start it, then push.

### 6.7 Prove it works
1. Change a heading, commit, push → watch the pipeline go green stage by stage
2. **Deliberately break a test and push** → confirm the pipeline **fails and does not deploy**

A pipeline you have never seen fail correctly is a pipeline you don't trust.

### 6.8 Note the contrast — you'll build this again in Actions

The copilot project uses GitHub Actions. Interviewers probe this comparison:

| | **Jenkins** | **GitHub Actions** |
|---|---|---|
| Runs on | A server you own, patch, and pay for | GitHub's runners, free within quota |
| Config | `Jenkinsfile`, Groovy DSL | YAML workflow |
| Setup | Hours — install, plugins, credentials, hardening | Minutes — commit a YAML file |
| Plugins | Huge ecosystem, but **plugin CVEs are your problem** | Marketplace actions; GitHub maintains the runner |
| AWS auth | IAM **instance role** | **OIDC** — short-lived per-run tokens |
| Scaling | You add agents | Automatic |
| Best at | Complex orchestration, self-hosted/regulated, non-GitHub sources | Anything already on GitHub; zero maintenance |

**Summary:** Jenkins gives you control and costs you maintenance; Actions gives you zero maintenance and costs you control.

**Exit criteria:** push triggers a build · all stages pass · app updates · broken test blocks deploy · SHA-tagged image in ECR · rollback tested · 8080 not publicly reachable

---

## Phase 7 — Ship it

**Goal:** it's live. **Time:** 1–2 hrs · **Cost:** $0 extra

1. **Postgres container** on the app server with a **named volume**. Use **`pgvector/pgvector:pg16`** (the copilot shares this container later). Create **two databases**: `system_design_studio` and `enterprise_knowledge_copilot`.
2. `/opt/apps/sds/.env.prod` on the server, **`chmod 600`**. Never commit it.
3. `/opt/apps/sds/docker-compose.yml` referencing the **ECR image via `${IMAGE_TAG}`** — not a local build.
4. Trigger the Jenkins pipeline.
5. **Seed once.** `npm run db:seed` needs `tsx`, a devDependency **not present in the slim runtime image** (verified by building it — fails with `tsx: not found`). Run it from the **builder stage** instead, against the same network as the deployed Postgres:
   ```bash
   docker build --target builder -t sds-builder:latest .
   docker run --rm --network <compose-network-name> \
     -e DATABASE_URL=postgresql://sds:<pw>@postgres:5432/system_design_studio \
     sds-builder:latest npm run db:seed
   docker rmi sds-builder:latest   # one-time use, don't leave it around
   ```
   Seeds 6 problems from `prisma/problems.data.ts`. This is a one-time operation, not part of the regular deploy — do not wire it into the Jenkinsfile.
6. Verify, in order:
   - `https://<duckdns-name>` loads, padlock green
   - Register → log in → refresh → **still logged in**
   - `/problems` shows 6 problems *(empty = seeding didn't run)*
   - Create a design, save, reload → persists
   - Submit an evaluation → **wait up to 80s** → scores appear
   - `/account` shows the token/cost ledger
   - Public share link `/d/<id>` works while logged out

**Exit criteria:** all seven steps pass

---

## Phase 8 — Operations and cost control  *(shared foundation)*

**Time:** ~1 hr

1. **Logs:** `docker compose logs -f`. Learn `docker stats` — on 2 GB you want to know what's eating RAM.
2. **Backups:** nightly `cron` running `pg_dump` for both databases. **Then actually test a restore.** An untested backup is not a backup.
3. **`restart: unless-stopped`** on every service so the stack returns after reboot.
4. **CloudWatch alarm:** CPU > 80% for 10 minutes.
5. **Rollback drill:** `IMAGE_TAG=<previous-sha> docker compose up -d`. Practice once now, not during an incident.
6. **Biggest cost lever:** stop the app server when not demoing. Stopped EC2 = no compute charge, ~$2.40/month disk. Data survives; the Elastic IP keeps the URL stable.
7. **Cost Explorer** weekly for the first month. Calendar reminder for **month 5**, before credits expire.

**➡️ Next: `Enterprise-knowledge-copilot/AWS-DEPLOYMENT-PLAN.md`**

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `@prisma/client did not initialize yet` | Generated client not copied to runtime stage | Phase 3.3 |
| `Cannot find module '@prisma/engines'` | Cherry-picked only `@prisma/client`, missed the CLI's other transitive deps | Copy the whole `@prisma/` scope, not individual packages — see Dockerfile comment |
| `prisma_schema_build_bg.wasm` ENOENT when running `db:deploy` | `node_modules/.bin/prisma` is a symlink whose bundled loader resolves sibling assets relative to its physical location; Docker's COPY doesn't preserve that | `db:deploy` calls `node node_modules/prisma/build/index.js migrate deploy` directly instead of the symlink |
| `tsx: not found` running `db:seed` in the container | `tsx` is a devDependency, absent from the slim runtime image by design | Run seed from `docker build --target builder`, not the runtime image — Phase 7.5 |
| Login loops back to `/login` | `AUTH_URL` wrong, or `X-Forwarded-Proto` not forwarded | Phase 3.6 / 5.4 |
| 504 after ~60s on evaluate | Nginx default read timeout | `proxy_read_timeout 300s` |
| `/problems` empty | Seed never ran, or ran against the wrong DB | Phase 7.5 |
| Prisma can't reach DB | Using `localhost` instead of the service name | `DATABASE_URL` host = `postgres` |
| GitHub login fails | Callback URL not updated | GitHub OAuth app settings |
| **DB unexpectedly reset** | Ran `db:migrate` (`migrate dev`) in prod | Use `db:deploy` — restore from backup |
| SSH `Permission denied` | `.pem` permissions too open on Windows | Restrict so only your user can read it |
| SSH times out | Security group source IP changed (new ISP address) | Update the rule to your current IP |
| URL stopped working after restart | No Elastic IP; public IP changed | Phase 4.3 |
| Site down, cert expired | Certbot auto-renew not scheduled | `certbot renew --dry-run` |
| Jenkins can't SSH to app server | `apps-sg` missing the rule from `jenkins-sg` | Phase 6.3 |
| Jenkins can't push to ECR | Instance role not attached, or missing policy | Phase 6.3 |
| Unexpected AWS charge | Unattached Elastic IP, or an instance left running | Cost Explorer → find the resource |

---

## 10. Progress tracker

| Phase | Status | Notes |
|---|---|---|
| 1 — AWS account + billing *(shared)* | ☐ Not started | **User must do this in the AWS console** |
| 2 — Concepts *(shared)* | ☐ Not started | reading only |
| 3 — Dockerise this app | 🟡 Mostly done | Dockerfile, .dockerignore, docker-compose.yml, next.config.ts, package.json all created and build-verified end-to-end (migrate, seed, register, problems API all confirmed working against the real built image). Three real Dockerfile bugs found and fixed — see Section 3.3. Remaining: canvas save + LLM evaluation need real `GEMINI_API_KEY`/`GROQ_API_KEY`, not available in this session |
| 4 — App server *(shared)* | ☐ Not started | needs an AWS account (Phase 1) |
| 5 — Domain + HTTPS *(shared)* | ☐ Not started | needs Phase 4 |
| 6 — Jenkins pipeline | ☐ Not started | needs Phase 4 |
| 7 — Ship it | ☐ Not started | needs Phases 4–6 |
| 8 — Operations *(shared)* | ☐ Not started | needs Phase 7 |

### Values to fill in

| Item | Value |
|---|---|
| AWS account ID | |
| Region | `ap-south-1` |
| App server Elastic IP | |
| Jenkins instance IP | |
| DuckDNS hostname | |
| ECR registry URL | |
| Live URL | |

### Final checklist

**App**
- [ ] HTTPS loads with a valid certificate; HTTP redirects to HTTPS
- [ ] Register → login → refresh → still logged in
- [ ] `/problems` shows 6 seeded problems
- [ ] Canvas design saves and reloads
- [ ] Evaluation returns AI scores (allow up to 80s)
- [ ] `/account` shows the cost ledger
- [ ] Public share link works while logged out

**Jenkins pipeline**
- [ ] `git push` auto-triggers a build
- [ ] All 8 stages pass and the app updates
- [ ] **A deliberately broken test fails the build and blocks the deploy**
- [ ] Image in ECR is tagged with the git SHA
- [ ] Rollback to a previous SHA works
- [ ] Jenkins reaches ECR with **no stored AWS keys** (instance role)
- [ ] Port 8080 is **not** reachable from the open internet

**Infrastructure**
- [ ] Full EC2 reboot → everything returns with no manual steps
- [ ] `pg_dump` backup runs, and a restore into a scratch DB works
- [ ] Budgets show spend tracking against credits, alerts armed
- [ ] Ports 5432 / 3000 are **not** reachable publicly

---

## 11. Time estimate

| Phase | Time |
|---|---|
| 1 — Account + billing | 45 min |
| 2 — Concepts | 1 hr |
| 3 — Dockerise | 2 hrs |
| 4 — App server | 45 min |
| 5 — Domain + HTTPS | 30 min |
| 6 — **Jenkins pipeline** | **4–6 hrs** |
| 7 — Ship | 1–2 hrs |
| 8 — Operations | 1 hr |
| **Total** | **~1.5–2 focused days** |

Phase 6 is where the time goes. Everything else is clicking through consoles.
