# AWS + Cloudflare Infrastructure (CloudFormation)

Three stacks that work together. Deploy them in order.

```
01-vpc.yaml    →  VPC, subnets, IGW, route tables, security groups
02-ec2.yaml    →  t2.micro EC2, Docker, Nginx, Elastic IP, IAM role
03-data.yaml   →  RDS Postgres db.t3.micro, S3 bucket
```

---

## Prerequisites

| Tool | Install |
|---|---|
| AWS CLI v2 | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| `aws configure` | Run it — enter your Access Key ID, Secret, region, output=json |
| EC2 key pair | AWS Console → EC2 → Key Pairs → Create |
| Your public IP | https://checkip.amazonaws.com |

---

## Deploy

```bash
chmod +x deploy.sh

./deploy.sh myproject ap-southeast-1 my-keypair 203.0.113.5/32 MyDBPassword123!
#           ^project   ^region        ^keypair   ^your-ip/32    ^db-password
```

The script deploys all three stacks and prints your Elastic IP, RDS endpoint, and S3 bucket name at the end.

---

## After deployment

### 1. Point Cloudflare to your EC2
1. Log in to Cloudflare → your domain → DNS
2. Add an **A record**:  
   - Name: `@` (or `www`)  
   - IPv4: your Elastic IP  
   - Proxy: **ON** (orange cloud)
3. SSL/TLS → set mode to **Full**

### 2. SSH into the server
```bash
ssh -i ~/.ssh/my-keypair.pem ec2-user@<elastic-ip>
```

### 3. Deploy your Docker image
Edit `/app/docker-compose.yml` — replace `nginx:alpine` (the app service) with your image:
```yaml
services:
  app:
    image: ghcr.io/yourusername/yourapp:latest
    environment:
      - DATABASE_URL=postgres://appuser:pass@<rds-endpoint>:5432/appdb
      - AWS_DEFAULT_REGION=ap-southeast-1
```

Then restart:
```bash
cd /app && docker compose pull && docker compose up -d
```

### 4. Connect to RDS from your app
```
DATABASE_URL=postgres://appuser:<password>@<rds-endpoint>:5432/appdb
```
RDS is in a private subnet — only reachable from within the VPC (i.e. from your EC2).

### 5. Use S3 from your app
The EC2 IAM role already has read/write access to the S3 bucket.  
Bucket name format: `myproject-assets-<account-id>`

In your app, use the AWS SDK — no keys needed, the role handles auth automatically.

---

## Tearing down

```bash
# Delete in reverse order
aws cloudformation delete-stack --stack-name myproject-data --region ap-southeast-1
aws cloudformation delete-stack --stack-name myproject-ec2  --region ap-southeast-1
aws cloudformation delete-stack --stack-name myproject-vpc  --region ap-southeast-1
```

> **Note:** The RDS stack has `DeletionPolicy: Snapshot` — it will take a final snapshot before deleting. You'll be charged a small amount for the snapshot storage until you manually delete it.

---

## Free tier limits to watch

| Resource | Limit | Where to monitor |
|---|---|---|
| EC2 t2.micro | 750 hrs/month | AWS Billing → Free Tier |
| RDS db.t3.micro | 750 hrs/month | AWS Billing → Free Tier |
| S3 | 5 GB / 20k GET / 2k PUT | S3 → Metrics |
| Data transfer out | 100 GB/month | CloudWatch → NetworkOut |

Set a **billing alert** at $1 in AWS Billing → Budgets so you get emailed before you're charged.
