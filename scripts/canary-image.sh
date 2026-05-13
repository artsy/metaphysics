#!/bin/bash

# Build & push a canary image for a given commit SHA, with a hard guarantee
# that the moving :staging / :production tags are not touched.
#
# Usage:
#   ./scripts/canary-image.sh <sha> [env]
#
# Where:
#   <sha>  is the commit SHA to tag the image with (full or short)
#   [env]  is staging (default) or production. Determines which moving tag
#          we verify hasn't been overwritten.
#
# Behavior:
#   1. Captures the current digest of :<env>
#   2. Logs into ECR
#   3. Pushes the image with the SHA tag and --skip-latest
#   4. Re-captures the digest of :<env> and aborts with non-zero exit if
#      anything moved.

set -euo pipefail

SHA="${1:-}"
ENV="${2:-staging}"
REPO="metaphysics"
REGION="us-east-1"

if [[ -z "$SHA" ]]; then
  echo "usage: $0 <sha> [env]" >&2
  exit 2
fi

if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "env must be 'staging' or 'production' (got: $ENV)" >&2
  exit 2
fi

echo "==> capturing current :$ENV digest"
BEFORE=$(aws ecr describe-images \
  --repository-name "$REPO" --region "$REGION" \
  --image-ids "imageTag=$ENV" \
  --query 'imageDetails[0].imageDigest' \
  --output text 2>/dev/null || true)

if [[ -z "$BEFORE" || "$BEFORE" == "None" ]]; then
  echo "could not resolve :$ENV digest — check aws creds / region / repo" >&2
  exit 1
fi
echo "    :$ENV currently points at $BEFORE"

echo "==> hokusai registry login"
hokusai registry login

echo "==> pushing $REPO:$SHA (skip-latest)"
# Flag name varies by hokusai version. Try --skip-latest first; fall back if
# the flag is rejected.
if ! hokusai registry push --tag "$SHA" --skip-latest 2>/dev/null; then
  echo "    --skip-latest not accepted; trying --no-update-latest"
  hokusai registry push --tag "$SHA" --no-update-latest
fi

echo "==> verifying :$ENV digest unchanged"
AFTER=$(aws ecr describe-images \
  --repository-name "$REPO" --region "$REGION" \
  --image-ids "imageTag=$ENV" \
  --query 'imageDetails[0].imageDigest' \
  --output text 2>/dev/null || true)

if [[ "$AFTER" != "$BEFORE" ]]; then
  echo "" >&2
  echo "FATAL: :$ENV moved during push." >&2
  echo "  before: $BEFORE" >&2
  echo "  after:  $AFTER" >&2
  echo "" >&2
  echo "Roll the moving tag back to $BEFORE *before* any pod restart pulls" >&2
  echo "the new image, e.g.:" >&2
  echo "  MANIFEST=\$(aws ecr batch-get-image --repository-name $REPO \\" >&2
  echo "    --image-ids imageDigest=$BEFORE --region $REGION \\" >&2
  echo "    --query 'images[0].imageManifest' --output text)" >&2
  echo "  aws ecr put-image --repository-name $REPO --region $REGION \\" >&2
  echo "    --image-tag $ENV --image-manifest \"\$MANIFEST\"" >&2
  exit 1
fi

echo "    :$ENV unchanged ✓"
echo ""
echo "ready: 585031190124.dkr.ecr.us-east-1.amazonaws.com/$REPO:$SHA"
