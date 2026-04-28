#!/usr/bin/env bash
# deploy.sh — deploys all three CloudFormation stacks in order.
# Usage: ./deploy.sh <project-name> <region> <key-pair-name> <your-ip> <db-password>
#
# Example:
#   ./deploy.sh myproject ap-southeast-1 my-keypair 203.0.113.5/32 Sup3rS3cret!
#
# Prerequisites:
#   1. AWS CLI installed and configured (aws configure)
#   2. A key pair created in EC2 console in the target region
#   3. jq installed (brew install jq / apt install jq)

set -euo pipefail

PROJECT="${1:?Usage: $0 <project> <region> <keypair> <your-ip/32> <db-password>}"
REGION="${2:?}"
KEYPAIR="${3:?}"
MY_IP="${4:?}"
DB_PASS="${5:?}"

echo "==> Deploying stack 1/3: VPC + Networking"
aws cloudformation deploy \
  --stack-name "${PROJECT}-vpc" \
  --template-file 01vpc.yaml \
  --region "${REGION}" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    ProjectName="${PROJECT}" \
    MyIpCidr="${MY_IP}"

echo "==> Deploying stack 2/3: EC2 + Docker"
aws cloudformation deploy \
  --stack-name "${PROJECT}-ec2" \
  --template-file 02ec2.yaml \
  --region "${REGION}" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName="${PROJECT}" \
    KeyPairName="${KEYPAIR}"

echo "==> Deploying stack 3/3: RDS + S3"
aws cloudformation deploy \
  --stack-name "${PROJECT}-data" \
  --template-file 03data.yaml \
  --region "${REGION}" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    ProjectName="${PROJECT}" \
    DBPassword="${DB_PASS}"

echo ""
echo "✅  All stacks deployed!"
echo ""
echo "--- Outputs ---"
PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name "${PROJECT}-ec2" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIp'].OutputValue" \
  --output text)

RDS_HOST=$(aws cloudformation describe-stacks \
  --stack-name "${PROJECT}-data" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='RDSEndpoint'].OutputValue" \
  --output text)

S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "${PROJECT}-data" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" \
  --output text)

echo "  EC2 Elastic IP  : ${PUBLIC_IP}"
echo "  RDS Endpoint    : ${RDS_HOST}"
echo "  S3 Bucket       : ${S3_BUCKET}"
echo ""
echo "Next steps:"
echo "  1. Point Cloudflare A record → ${PUBLIC_IP}"
echo "  2. SSH in: ssh -i ~/.ssh/${KEYPAIR}.pem ec2-user@${PUBLIC_IP}"
echo "  3. Edit /app/docker-compose.yml to use your real Docker image"
echo "  4. Set DATABASE_URL=postgres://appuser:<pass>@${RDS_HOST}:5432/appdb"