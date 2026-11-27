---
name: add-field
description: Checklist for adding or changing a GraphQL field, type, connection, mutation or loader in Metaphysics v2. Use when a task adds schema surface or a new upstream REST call.
---

# Add a field, type or mutation

Follow the conventions in `AGENTS.md`. The docs below are the source of truth for each step, so read the one that applies before writing code. This checklist doesn't repeat them. It only covers the steps that get missed.

| Task                         | Read first                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| New loader or upstream call  | [docs/dataloaders.md](../../../docs/dataloaders.md)                                       |
| New connection               | [docs/pagination.md](../../../docs/pagination.md)                                         |
| Rollout behind a flag        | [docs/feature-flags.md](../../../docs/feature-flags.md)                                   |
| New upstream service         | [docs/adding_a_new_rest_microservice.md](../../../docs/adding_a_new_rest_microservice.md) |
| Tests                        | [docs/testing.md](../../../docs/testing.md)                                               |
| Schema dump and distribution | [docs/automated-schema-updates.md](../../../docs/automated-schema-updates.md)             |

If the code and a doc disagree, follow the code and tell the developer which line of the doc is stale so they can fix it in the same PR.

## 1. Find a neighbour

Find the closest existing field in `src/schema/v2/` and match its shape. For connections, check the neighbour against `docs/pagination.md` before copying, because the doc warns that many existing connections paginate incorrectly.

## 2. Loader

- Pick `loaders_with_authentication` or `loaders_without_authentication` as `docs/dataloaders.md` describes. Name it `<thing>Loader` and keep the exported object alphabetical.
- If the field sits on a type returned by a connection, don't call a loader per node. Batch in the connection resolver (see the N+1 section in `AGENTS.md`).

## 3. Schema

- Expose `internalID`, never a database `id`. `id` is the Relay global ID.
- Keep field lists and enum values alphabetical.
- Give every field a `description`.
- Connections: follow `docs/pagination.md` step by step.
- Mutations: use the `add-mutation` skill.
- Non-null fields backed by a loader must not throw. Degrade instead, or GraphQL drops the parent node.
- Register new root fields or mutations in `src/schema/v2/schema.ts`, alphabetically.

## 4. Tests

Follow `docs/testing.md`. Assert how each loader was called, not only what came back.

## 5. Schema dump

Run `yarn dump:local` and commit `_schemaV2.graphql`. `docs/automated-schema-updates.md` explains the CI check and the pre-commit hook, so never commit with `--no-verify`.

## 6. Verify

Run `yarn jest <changed test files>`, `yarn type-check` and `yarn lint`. Then run the `live-check` skill.
