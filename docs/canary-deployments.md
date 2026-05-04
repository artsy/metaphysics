# Canary deployment

A canary is a second Kubernetes Deployment running a different image alongside
the canonical `metaphysics-web` Deployment. Both are selected by the same
Service, so traffic is split round-robin in proportion to the replica count.
Use it to observe a risky change against real traffic before rolling it out
everywhere.

The canonical Artsy procedure lives in
[`artsy/README/playbooks/hokusai.md`](https://github.com/artsy/README/blob/master/playbooks/hokusai.md#creating-a-canary-deployment).
This page is a metaphysics-specific summary.

## When to use a canary

- A baseline change you can't easily feature-flag (Yoga upgrades, large
  stitching refactors, dependency bumps that touch every request).
- A change you want to compare against canonical in Datadog / Sentry (error
  rate, p99, memory) before exposing 100% of traffic to it.

## Prerequisites

- `hokusai`, `kubectl`, and `aws ecr` configured for the cluster you're targeting.
- The canary branch pushed. Note the commit SHA — that's the image tag you'll
  use everywhere below (`...metaphysics:<sha>`).

## 1. Build & push the canary image

Push only the immutable SHA tag. Never overwrite the moving `:staging` /
`:production` tags — canonical deployments pull them and `imagePullPolicy: Always`, so updating them silently rolls your change to 100% of that env on
the next pod restart.

### Option A (recommended) — trigger the `canary` workflow in CircleCI

The `canary` workflow runs `test`, `type-check`, then `canary-image-push`
(captures `:staging`'s digest, pushes with `--skip-latest`, fails loudly if
the moving tag is altered).

```sh
curl -X POST -u "$CIRCLE_TOKEN:" \
  -H 'Content-Type: application/json' \
  -d '{"branch":"<your-branch>","parameters":{"canary_build":true}}' \
  https://circleci.com/api/v2/project/gh/artsy/metaphysics/pipeline
```

### Option B — locally with `scripts/canary-image.sh`

```sh
./scripts/canary-image.sh <sha>            # staging (default)
./scripts/canary-image.sh <sha> production
```

Same digest-capture + verify behavior as the CI job.

## 2. Add the canary Deployment to the Hokusai spec

Open this as a **separate PR from the change you're canarying**, branched off
`main`. Don't merge the change PR until rollout is done — that would deploy to
100% of canonical staging via `hokusai/deploy-staging` and make the canary
pointless.

Edit `hokusai/staging.yml` (or `hokusai/production.yml`). Copy the existing
`metaphysics-web` Deployment block and tweak:

- Append `-canary` to every `name` / label value that contains the deployment
  name. **Keep** the `app: metaphysics` Service selector so traffic splits.
- `spec.replicas: 1` — roughly `1 / (1 + N)` traffic share. No separate HPA.
- `container.image` → the **SHA-tagged** image. Never `:staging` /
  `:production`.
- Prepend Datadog overrides under `container.env`:
  ```yaml
  - name: DD_TRACER_SERVICE_NAME
    value: metaphysics-canary
  - name: DD_VERSION
    value: <sha>
  ```

Example diff: [artsy/metaphysics#1619](https://github.com/artsy/metaphysics/pull/1619/files).

## 3. Apply

```sh
hokusai staging update     # or: hokusai production update
```

## 4. Monitor

- **Datadog:** filter `service:metaphysics-canary` vs `service:metaphysics`.
  Compare error rate, p50/p95/p99 latency, memory.
- **Sentry:** filter `release:<sha>` for new signatures.
- **Logs:** `kubectl --context [staging|production] logs -l app.kubernetes.io/version=canary -f`.

## 5. Roll forward or back

**Roll back:** revert the canary YAML PR, then
`kubectl --context [staging|production] delete deployment metaphysics-web-canary`
(`hokusai update` does not garbage-collect). Fix the branch, rebuild image
(step 1), repeat from step 2.

**Roll forward:** merge the change PR (canonical staging deploys on merge to
`main`; production on the next release tag). Then open a cleanup PR removing
both canary blocks and run `kubectl delete deployment metaphysics-web-canary`
in both contexts.

## Suggested order

1. Build & push image (step 1).
2. Staging canary YAML PR → soak ~24h.
3. Production canary YAML PR → soak ~24h.
4. Merge the change PR.
5. Cleanup PR + `kubectl delete` in both envs.

The image build, canary YAML, change PR, and cleanup are **separate workflows**
— bundling defeats the canary.

## Caveats

- **The canary serves real traffic.** Mutations and external API calls run
  for the share of users that hits it.
- **Schema-changing canaries are risky.** Persistent caches (CDN, Force's
  query-id cache) don't distinguish canary vs canonical responses; expect
  cache poisoning if the schema shape differs.
- **Don't relax the `only_main` filter on the default `hokusai/push` job** —
  that path updates `:staging`. Use the `canary` workflow instead.
