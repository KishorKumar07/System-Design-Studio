# Deployment Progress Tracker

Tracks progress against [AWS-DEPLOYMENT-PLAN.md](AWS-DEPLOYMENT-PLAN.md).

**Owner:** Kishor · **Last updated:** 2026-10-11

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 1 — AWS account + billing | Done | Completed 2026-10-09 / 2026-10-10 |
| 2 — Concepts | Done | Region/AZ, EC2, EBS, VPC, Security Group, Key Pair, IAM, ECR |
| 3 — Dockerise this app | Mostly done | Dockerfile, compose and build verified earlier; canvas save and LLM evaluation still need real API keys |
| 4 — App server | Done (verified 2026-10-11) | SSH works, Docker 25 + Compose, 4 GB swap, 30 GB disk, Elastic IP attached |
| 5 — Domain + HTTPS | Done (verified 2026-10-11) | DNS resolves, HTTP redirects to HTTPS, Nginx proxies to :3000, certificate valid to 2027-01-08, certbot renewal dry-run passes |
| 6 — Jenkins pipeline | Done (2026-10-11) | Build #5 green end to end. Deploy uses a key file on the Jenkins server. Open: broken-test-blocks-deploy test and rollback test |
| 7 — Ship it | Done (2026-10-11) | Live over HTTPS, migrated, 6 problems seeded, register/login/refresh/problems/evaluate verified in browser |
| 8 — Operations | Not started | Needs Phase 7 |

## Phase 1 checklist

- [x] AWS account created (Free plan, Basic support)
- [x] Root user secured with MFA
- [x] IAM user `kishor-admin` created with AdministratorAccess
- [x] MFA enabled on `kishor-admin`
- [x] Signed in as `kishor-admin` (not root)
- [x] Billing preferences: PDF invoices and Free Tier alerts on
- [x] Zero-spend budget created
- [x] Monthly $30 budget created
- [x] Credits confirmed ($120 remaining)
- [x] Region set to Asia Pacific (Mumbai) `ap-south-1`

## Key dates

| Item | Date |
|---|---|
| Free plan period ends | 2027-04-09 |
| Credits expire | 2027-10-09 |

## Values to fill in

| Item | Value |
|---|---|
| Region | `ap-south-1` |
| App server Elastic IP | `3.7.202.176` |
| Jenkins instance IP | `43.204.211.71` at last start; changes on every start (reach the UI through an SSH tunnel; 8080 is not public) |
| DuckDNS hostname | `kishor-apps.duckdns.org` |
| ECR repository | `system-design-studio` in `ap-south-1`, keep last 10 images |
| Live URL | https://kishor-apps.duckdns.org |

## Operations

### Verified (2026-10-11)
- [x] Push to `master` builds, tests and deploys automatically (builds #6, #9)
- [x] A failing test stops the pipeline before Deploy (builds #7, #8)
- [x] Rollback to a previous image tag works in seconds, data intact
- [x] Nightly Postgres backup to S3 (02:00 IST), restore tested into a temporary DB
- [x] Jenkins port 8080 is not public (SSH tunnel only)

### Cost control
- `jenkins`: keep **stopped** unless deploying. It has no Elastic IP, so its public IP changes on every start.
- `apps-prod`: running while the project is being shown; may be stopped between demos. Do **not** release its Elastic IP.
- While both are stopped, only disks, the Elastic IP, ECR and S3 are billed (about $8/month).
- Free plan ends 2027-04-09; credits expire 2027-10-09.

### Starting things again
**apps-prod** (same IP and DNS name after start)
1. EC2 console, Instance state, Start.
2. Wait about 1 minute, then open https://kishor-apps.duckdns.org
3. If the certificate shows an error after a long stop, open a Session Manager terminal (Systems Manager,
   Fleet Manager, `apps-prod`, Connect) and run `sudo certbot renew`. There is no SSH rule for a personal IP any more.

**jenkins** (public IP changes)
1. EC2 console, Instance state, Start. Note the new public IP.
2. Open the tunnel with the new IP:
   `ssh -i $HOME\.ssh\ekc-key.pem -L 8081:localhost:8080 ec2-user@<new-ip>`
3. Open http://localhost:8081
4. If SSH times out, your own IP changed: edit the SSH rule in `jenkins-sg` to your current IP. (`apps-sg` has no
   personal-IP SSH rule any more; Jenkins reaches `apps-prod` through the `jenkins-sg` to `apps-sg` rule.)
5. Push to `master`, then wait up to 5 minutes for the poll (do not also click Build Now).

### Rollback
On `apps-prod`: `cd /opt/apps/sds && IMAGE_TAG=<older-sha> docker compose up -d app`
Available tags are listed in ECR (`system-design-studio`).

## Update 2026-10-20: the server is now shared with a second project

`apps-prod` also runs the Enterprise Knowledge Copilot (https://kishor-ekc.duckdns.org), deployed with
GitHub Actions. System Design Studio itself is unchanged; these are the things that changed around it.

| What | Before | Now |
|---|---|---|
| `apps-prod` instance type | `t3.small` (2 GB) | `c7i-flex.large` (2 vCPU, 4 GB). `t3.medium` is rejected on the AWS Free plan, and the other app needs about 2.2 GB. Same IP, disk and data |
| Cost while running | about $28/month for both servers | about $75/month, so **stop `apps-prod` between demos** |
| Shell access to `apps-prod` | SSH from my IP | **Session Manager** (browser terminal), no inbound port. The personal-IP SSH rule was deleted from `apps-sg` |
| Host alarms | none | CloudWatch alarms for CPU, status check, memory and disk, emailed through SNS topic `ekc-alerts` |
| Nightly backup | `system_design_studio` only | plus `enterprise_knowledge_copilot`, 15 minutes later, same bucket |

Both apps' containers restart by themselves after a stop or a reboot (tested with a full reboot).
SDS keeps its own Postgres container; the other app has its own, so the two share nothing but the host,
Nginx and the Elastic IP.
