---
name: add-field
description: Checklist for adding or changing a GraphQL field, type, connection, mutation or loader in Metaphysics v2. Use when a task adds schema surface or a new upstream REST call.
---

# Add a field, type or mutation

Follow the conventions in `AGENTS.md`. This checklist covers the steps that get missed.

## 1. Find a neighbour

Find the closest existing field or mutation in `src/schema/v2/` and copy its shape. Don't invent a new pattern when the repo already has one.

## 2. Loader

- Loaders live in `src/lib/loaders/loaders_with_authentication/<service>.ts` (user-scoped or uncached) and `loaders_without_authentication/<service>.ts` (public and memcached). Read `docs/dataloaders.md` before adding one.
- Name it `<thing>Loader`. Keep the exported object alphabetical.
- If the field sits on a type returned by a connection, don't call a loader per node. Batch in the connection resolver (see the N+1 section in `AGENTS.md`).

## 3. Schema

- Expose `internalID`, never a database `id`. `id` is the Relay global ID.
- Keep field lists and enum values alphabetical.
- Give every field a `description`.
- Connections: follow `docs/pagination.md` (`paginationResolver`, `pageable` args, `totalCount`).
- Mutations: return `<Name>Success | <Name>Failure` as `<Name>ResponseOrError`, and name the output field after what it returns (`artworkOrError`, not `responseOrError`).
- Non-null fields backed by a loader must not throw. Degrade instead, or GraphQL drops the parent node.
- Register new root fields or mutations in `src/schema/v2/schema.ts`, alphabetically.

## 4. Tests

Follow `docs/testing.md`: run the query through `runQuery` or `runAuthenticatedQuery`, and stub only the loaders the field uses. Cover the failure branch of every mutation.

## 5. Schema dump

Run `yarn dump:local` and commit `_schemaV2.graphql`. CI fails on drift (`ensure-schema-update`). The pre-commit hook also runs the dump, so never commit with `--no-verify`.

## 6. Verify

Run `yarn jest <changed test files>`, `yarn type-check` and `yarn lint`. Then run the `live-check` skill.
