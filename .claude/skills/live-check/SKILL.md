---
name: live-check
description: Verify a Metaphysics change against the locally running server with real GraphQL requests (curl), not only jest. Use before opening or updating a PR that adds or changes a field, query or mutation.
---

# Live check

Unit tests mock the loaders. A live check proves the change works against a real upstream (usually staging Gravity).

## Rules

- The developer runs the server. Never start, stop or restart it. If it doesn't answer, say so and stop.
- The server serves whatever branch the main checkout has checked out. Confirm with `git branch --show-current` before you trust a result.
- Never print, log or commit the access token. Redact it in any transcript.
- Introspection is off on the local server. Find field and argument names in `_schemaV2.graphql`, and run `yarn dump:local` first if you changed the schema.

## Setup

Read these from the environment, or ask the developer for them:

- `METAPHYSICS_URL`: defaults to `http://localhost:${PORT:-3000}/v2`. Many developers run on 5001.
- `METAPHYSICS_TOKEN`: a staging user access token, sent as `X-ACCESS-TOKEN`.
- `METAPHYSICS_USER_ID`: needed for `me`-scoped fields, sent as `X-USER-ID`.

```sh
curl -s "$METAPHYSICS_URL" \
  -H "Content-Type: application/json" \
  -H "X-ACCESS-TOKEN: $METAPHYSICS_TOKEN" \
  -H "X-USER-ID: $METAPHYSICS_USER_ID" \
  -d @query.json | python3 -m json.tool
```

Put the query in a file (`{"query": "...", "variables": {...}}`) under the scratchpad so you don't have to escape it in the shell.

## What to run

1. **Happy path:** the new or changed field or mutation, with realistic arguments.
2. **One deliberate failure:** a bad ID, a missing permission or an invalid input. Check that the error shape matches the schema, for example the `…Failure` branch of a `…OrError` union, and not a top-level `errors` entry.
3. **Connections:** request a page (`first: 10`) and check the server log or Datadog trace for one upstream call per page, not one per node.
4. **Cleanup:** delete any record a mutation created on staging.

## Report

Give a short transcript of each request and response (token redacted). Add a line to the PR body: “Verified against staging: <what you ran>.”
