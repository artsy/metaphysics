# Creating a Metaphysics Review App

A review app is a per-branch Metaphysics instance with its own URL, deployed to the staging
Kubernetes cluster. It gives you an isolated GraphQL endpoint to test server-driven changes
against — e.g. point Eigen's custom GraphQL URL at it instead of shared staging.

## Quick start

1. Push a commit to a branch whose name starts with `review-app-` (e.g. `review-app-hello-world`).
2. CircleCI matches the `review-app-` prefix and either **creates** the app (first push) or
   **updates** it (subsequent pushes), then creates the DNS record.
3. Once CI is green, the app is reachable at **`https://metaphysics-hello-world.artsy.net`**
   (the `review-app-` prefix is stripped and `metaphysics-` is prepended).

Point Eigen at it by setting its custom GraphQL URL to
`https://metaphysics-hello-world.artsy.net`.

> The hostname is intentionally prefixed with `metaphysics-` so review apps don't collide with
> Force's review apps (which use `<name>.artsy.net`).

## What CI runs

Two CircleCI jobs, both filtered to `/^review-app-.*/` branches:

1. **`create_or_update_review_app`** — checks whether a namespace for the app exists; if not it
   runs [`build_review_app.sh`](../scripts/build_review_app.sh), otherwise
   [`update_review_app.sh`](../scripts/update_review_app.sh). Both call
   [`rewrite_review_app_yaml.sh`](../scripts/rewrite_review_app_yaml.sh), which points the
   generated Hokusai YAML at this app's Docker image and rewrites **all three** staging ingress
   hosts (`metaphysics-staging`, `metaphysics-cdn-staging`, `metaphysics-staging-alt`) to
   review-app-scoped hosts. It aborts if any `staging.artsy.net` host survives, so a review app
   can never hijack real staging ingress traffic.
2. **`create_review_app_subdomain`** — runs
   [`create-review-app-subdomain.js`](../scripts/create-review-app-subdomain.js), which creates a
   Cloudflare CNAME `metaphysics-<name>.artsy.net → nginx-staging-2025.artsy.net`. It is
   idempotent (skips if the record already exists) and fails loudly if its Cloudflare env vars are
   missing. Requires the `cloudflare` CircleCI context (`CLOUDFLARE_ZONE_ID`,
   `CLOUDFLARE_API_TOKEN`).

Metaphysics is a stateless GraphQL API, so review apps inherit staging's environment (Gravity
URLs etc.) via `hokusai review_app setup` — no custom env is set.

## Building locally

Slower (it builds and pushes the Docker image from your machine), but sometimes handy. First make
sure `jq` is installed:

```sh
brew install jq
```

Then:

```sh
./scripts/build_review_app.sh hello-world
```

This saves the K8s spec to `hokusai/hello-world.yml`. When building locally you must create the
Cloudflare CNAME yourself (CI does this for you otherwise):

1. [Log in to Cloudflare](https://dash.cloudflare.com/), go to **artsy.net** > **DNS**.
2. **+ Add Record** → Type `CNAME`, Name `metaphysics-hello-world`, Target
   `nginx-staging-2025.artsy.net`, Proxy status **Proxied**.
3. Optionally add the PR link as a comment and your team prefix as a tag.
4. Save; DNS propagates in a few minutes.

## Updating a review app

Push more commits to the `review-app-<name>` branch — CI redeploys and preserves the host; the
DNS record is not duplicated.

## Setting an env variable

```sh
hokusai review_app env set <name> SOME_ENV_VAR=true
hokusai review_app refresh <name>
```

## Deleting a review app

Delete review apps as soon as QA is complete — they don't get cleaned up automatically.

```sh
yarn delete-review-app hello-world
```

This deletes the Kubernetes namespace and, if `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are
set in your environment, the matching CNAME. If they aren't set, delete the CNAME manually in
Cloudflare (**artsy.net** > **DNS**, search `metaphysics-hello-world`).

## More info

See the [Hokusai Review Apps docs](https://github.com/artsy/hokusai/blob/master/docs/Review_Apps.md).
