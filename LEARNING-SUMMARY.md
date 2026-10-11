# AWS Deployment: Learning Summary

What I built and what I learned deploying System Design Studio to AWS.
Live site: https://kishor-apps.duckdns.org (when `apps-prod` is started).

## What I built

A Next.js app, running on AWS, that updates itself when I push code, refuses to
deploy broken code, and backs up its data every night.

```
Push code -> GitHub -> Jenkins (build + test) -> ECR (image storage) -> App server -> Users
                                                                          |
                                                              Database -> nightly backup -> S3
```

## The AWS pieces and what each one is for

| Piece | In plain words | What I used it for |
|---|---|---|
| **Region** | The city where AWS keeps my stuff | Mumbai (`ap-south-1`) |
| **EC2** | A rented Linux computer | `apps-prod` runs the site, `jenkins` builds code |
| **EBS** | The server's disk | Holds the database files |
| **Security Group** | Firewall: which ports are open, and to whom | 22 from my IP only, 80/443 open, 8080 never public |
| **Key pair** | The key file that lets me SSH in | `ekc-key.pem` |
| **IAM user / role** | Who may do what. A role is a permission slip for a machine | `kishor-admin` for me; roles so servers use ECR and S3 with no passwords |
| **ECR** | A private store for Docker images | One image per commit |
| **S3** | File storage outside any server | Database backups |
| **Elastic IP** | An address that does not change | Keeps the DuckDNS name working |

## DevOps ideas I used

1. **CI/CD**: a robot (Jenkins) installs, lints, type-checks, tests, builds,
   pushes and deploys. I never deploy by hand.
2. **Build and run on separate machines.** The app server only pulls images, so
   a bad build cannot hurt production.
3. **Tag images by commit** (for example `4fd8dfc`), never only `latest`. That is
   what makes rollback one command.
4. **Pipelines must fail safely.** A deliberately broken test stopped the deploy
   and the site stayed up (builds #7 and #8).
5. **Least privilege.** The app server can write only under `postgres/` in one
   bucket, nothing else.
6. **No secrets in git.** Keys live in `/opt/apps/sds/.env` (permission 600),
   generated on the server.
7. **A backup is not real until it is restored.** I restored into a temporary
   database and compared row counts.
8. **Cost guardrails first.** Budgets, Free plan with credits, stop servers
   when idle.

## Mistakes that taught me the most

| What happened | The lesson |
|---|---|
| Region list looked locked on a new account | New accounts take time to verify. Check account state first. |
| SSH timed out after my network changed | "My IP" rules go stale. Check the security group first. |
| Port 8080 was already used on my laptop | Use another local port for the SSH tunnel (8081). |
| `LayoutProps` type missing in Jenkins | "Works on my machine" often means a hidden generated folder. A clean checkout finds it. Fixed with `next typegen`. |
| Pasted SSH key in Jenkins was malformed | Prefer a key file on the server over copy-paste. |
| Deploy over public IP would not match a security-group rule | A group-to-group rule only matches private IPs. Deploy to the private address. |
| Read "SUCCESS" while a build was still running | Read the line that says `Finished:`. |
| Poll SCM plus Build Now gave two builds | After a push, wait for the poll. Do not also click Build Now. |

## Commands worth remembering

```bash
docker ps                                   # what is running
docker logs --tail 50 sds-app               # app logs
docker compose up -d app                    # start or update the app
IMAGE_TAG=<sha> docker compose up -d app    # roll back or forward
sudo systemctl status nginx                 # is the web server up
sudo certbot renew --dry-run                # will HTTPS renew
free -h ; df -h /                           # memory and disk
aws s3 ls s3://kishor-sds-backups-869935092639/postgres/ --recursive
```

## Stop vs Terminate

- **Stop** = shut the laptop. Data kept, small disk cost, public IP may change.
- **Terminate** = throw it in the bin. Server and disk gone for good.
- Always choose **Stop**.

## Cost notes

- Both servers running all the time: about $28 a month.
- Both stopped: about $8 a month (disks, Elastic IP, ECR, S3).
- Free plan period ends **2027-04-09**. Credits expire **2027-10-09**.
- Do not release the Elastic IP while stopped, or the DNS name breaks.
- The HTTPS certificate renews only while `apps-prod` is running.

## How I would explain this in an interview

"I deployed a Next.js and Postgres app to AWS using two EC2 instances: one
running the app behind Nginx with Let's Encrypt, and one running Jenkins.
Jenkins runs lint, typecheck and tests, builds a Docker image, pushes it to ECR
tagged by commit, and deploys over SSH with a health check. Servers use IAM
roles instead of keys, the database is backed up nightly to S3 with a tested
restore, and I validated that a failing test blocks the deploy and that I can
roll back in seconds."

## What to learn next

1. Terraform: write this setup as code so it can be rebuilt in minutes.
2. GitHub Actions with OIDC, as the comparison to Jenkins.
3. CloudWatch alarms and logs, to hear about problems before users do.
4. Application Load Balancer and RDS, which I skipped for cost. Learn what
   they would add.

## Where things live

| What | Where |
|---|---|
| Progress, restart and rollback steps | `PROGRESS-TRACKER.md` |
| Full deployment plan | `AWS-DEPLOYMENT-PLAN.md` |
| Pipeline | `Jenkinsfile` |
| Production compose, backup script and timer | `deploy/` |
| Backups | S3 bucket `kishor-sds-backups-869935092639` |
