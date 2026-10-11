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
| Jenkins instance IP | `43.204.211.71` (reach the UI through an SSH tunnel; 8080 is not public) |
| DuckDNS hostname | `kishor-apps.duckdns.org` |
| ECR repository | `system-design-studio` in `ap-south-1`, keep last 10 images |
| Live URL | https://kishor-apps.duckdns.org (502 until Phase 7 deploys the app) |
