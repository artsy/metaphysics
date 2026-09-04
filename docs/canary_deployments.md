# Canary Deployments

Use a canary to test a risky change against real production traffic before
rolling it out fully. The canary is a separate `metaphysics-web-canary`
Deployment (defined in `hokusai/production.yml` / `hokusai/staging.yml`) that
runs a candidate image (typically `metaphysics:staging`), receives a
configurable slice of production traffic, and reports to Datadog as its own
service
(`metaphysics-canary`) so you can compare it against main head-to-head.

## How to deploy a canary

See [#7742](https://github.com/artsy/metaphysics/pull/7742) for a reference
PR that sets all of this up end to end.

1. **Define the canary k8s objects** (if they don't already exist). In
   `hokusai/production.yml` / `hokusai/staging.yml`, duplicate each of the
   main web resources with a `-canary` name/component label:

   - `Deployment` → `metaphysics-web-canary` (override
     `DD_TRACER_SERVICE_NAME` to `metaphysics-canary`)
   - `HorizontalPodAutoscaler` → `metaphysics-web-canary`
   - `Service` → `metaphysics-web-canary-internal`
   - `Ingress` → `metaphysics-2025-canary`, with the same hosts as the main
     ingress plus the `nginx.ingress.kubernetes.io/canary: "true"` and
     `canary-weight` annotations

2. **Point the canary at your candidate image.** Any image tag works — we
   typically use `metaphysics:staging` because merging to `staging` builds
   it for free, but you can pin any ECR tag in the canary Deployment's
   `image:` field.

3. **Deploy and restart the pods so they pick up the image:**

   ```sh
   hokusai production update --skip-checks

   kubectl rollout restart deployment/metaphysics-web-canary
   kubectl rollout status deployment/metaphysics-web-canary
   ```

4. **Send it traffic.** Bump the `canary-weight` annotation on the
   `metaphysics-2025-canary` ingress in `hokusai/production.yml` and deploy:

   ```yaml
   nginx.ingress.kubernetes.io/canary-weight: "10" # % of prod traffic
   ```

   Start small (5–10%), then step up `20` → `50` → `100`, comparing against
   main (below) at each step before increasing.

## How to compare against main

The canary sets `DD_TRACER_SERVICE_NAME=metaphysics-canary`, so in Datadog
it's a separate APM service from `metaphysics`. Compare the two over the same
time window:

- **Error rate** — APM > Services: `metaphysics-canary` vs `metaphysics`.
  Any new error type or elevated rate on the canary is a stop signal.
- **Latency** — p50/p95/p99. Expect them to track main closely; a shifted
  p95+ usually means a real regression, not noise.
- **Memory / CPU** — the pods have a 1.5Gi memory limit; watch for the canary
  trending higher than main (leak) or OOMKills
  (`kubectl get pods -l component=web-canary`).
- **Logs** — filter by `service:metaphysics-canary` for anything new.

Give each traffic step enough time to gather a meaningful sample — at low
weights, rare errors take a while to show up.

## How to roll back

1. Git checkout `main` (which reverts the canary changes to `production.yml`
   or `staging.yml`) and run:

   ```sh
   hokusai staging/production update --skip-checks
   ```

2. Manually delete the canary Kubernetes objects (hokusai won't remove
   resources that are no longer in the yaml):

   ```sh
   kubectl --context staging/production delete ingress metaphysics-2025-canary
   kubectl --context staging/production delete service metaphysics-web-canary-internal
   kubectl --context staging/production delete hpa metaphysics-web-canary
   kubectl --context staging/production delete deployment metaphysics-web-canary
   ```

3. Confirm in Datadog that `metaphysics-canary` request volume drops to zero.

If you just need to stop traffic without tearing anything down, set
`canary-weight: "0"` on the `metaphysics-2025-canary` ingress and deploy —
nginx stops routing to the canary immediately while the pods stay up.

## Gotchas

- When the canary runs the `staging` image, it's the **staging image against
  production config** — whatever is on staging is what gets prod traffic, so
  check before dialing up.
- `canary-weight: "100"` is a full cutover: main gets zero traffic.
- The production canary HPA keeps 10–35 replicas running regardless of
  weight — scale it down when the canary isn't in use.
