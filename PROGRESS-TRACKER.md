# Deployment Progress Tracker

Tracks progress against [AWS-DEPLOYMENT-PLAN.md](AWS-DEPLOYMENT-PLAN.md).

**Owner:** Kishor · **Last updated:** 2026-10-10

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 1 — AWS account + billing | Done | Completed 2026-10-09 / 2026-10-10 |
| 2 — Concepts | Done | Region/AZ, EC2, EBS, VPC, Security Group, Key Pair, IAM, ECR |
| 3 — Dockerise this app | Mostly done | Dockerfile, compose and build verified earlier; canvas save and LLM evaluation still need real API keys |
| 4 — App server | Not started | Next up |
| 5 — Domain + HTTPS | Not started | Needs Phase 4 |
| 6 — Jenkins pipeline | Not started | Needs Phase 4 |
| 7 — Ship it | Not started | Needs Phases 4-6 |
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
| App server Elastic IP | |
| Jenkins instance IP | |
| DuckDNS hostname | |
| ECR registry URL | |
| Live URL | |
