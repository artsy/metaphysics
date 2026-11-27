# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Imperative Instructions!

- In almost all instances where a query returns data from the DB, we do not use an `id` field but rather an `internalID` field. `id` fields are specifically for Relay and bear no relationship to database IDs.
- Field _arguments_ do frequently use `id` however (eg, `artist(id: "andy-warhol") { ... }`), and the values passed to them can typically be `slug` or `internalID`.

## Code map

- `src/schema/v2/`: types, root fields and mutations. Register new root fields and mutations in `src/schema/v2/schema.ts`.
- `src/lib/loaders/loaders_with_authentication/` and `loaders_without_authentication/`: one file per upstream service. Public loaders are memcached.
- `src/lib/stitching/`: schemas stitched from GraphQL services (Exchange, Causality and others).
- `_schemaV2.graphql`: the dumped schema. Introspection is off locally, so read field names here.

Read the matching doc before working in an area:

- New loader or upstream call: [docs/dataloaders.md](docs/dataloaders.md)
- New connection: [docs/pagination.md](docs/pagination.md)
- New service: [docs/adding_a_new_rest_microservice.md](docs/adding_a_new_rest_microservice.md) or [docs/adding_a_new_graphql_microservice.md](docs/adding_a_new_graphql_microservice.md)
- Home view sections: [docs/adding_a_new_home_view_section.md](docs/adding_a_new_home_view_section.md)
- Tests: [docs/testing.md](docs/testing.md)

## Schema changes

Any change to the v2 schema needs `yarn dump:local` and a committed `_schemaV2.graphql`. CI fails on drift (`ensure-schema-update`). The husky pre-commit hook runs the dump for you, so don't commit with `--no-verify`.

## Performance: avoid per-node loader calls in connections (N+1)

Metaphysics fields often resolve by calling a REST loader (Gravity, Exchange, etc.). When such a field lives on a type that is returned by a connection, the resolver runs once **per node**, so a `first: 10` page fires 10 upstream REST calls and the fan-out scales with page size. This has caused real incidents: a per-node loader call in conversation message resolvers turned 40k `conversationsConnection` queries into 800k Exchange REST calls.

When writing or reviewing a resolver, flag any field resolver that awaits a loader on a type reachable through a connection. Prefer one of:

- **Batch at the connection resolver**: fetch the data once for the whole page, index it in-process (e.g. a `Set` of IDs), and stash the precomputed value on each node before returning. The field resolver then just reads the precomputed value.
- **Keep a fallback for standalone access**: if the type is also reachable outside a connection as a single node, the field resolver should use the precomputed value when present and only fall back to a single loader call when it isn't.
- **Use a DataLoader** with batching if the upstream endpoint supports fetching by multiple keys.

Example — adding a new `isSaved` field to a type returned by a connection:

```ts
// ❌ Per-node: a page of 10 artworks fires 10 Gravity calls
isSaved: {
  type: GraphQLBoolean,
  resolve: async ({ id }, _args, { savedArtworkLoader }) => {
    const { body } = await savedArtworkLoader(id)
    return body.is_saved
  },
}

// ✅ Batched: one Gravity call for the whole page, in the connection resolver
const { body: saved } = await savedArtworksLoader({ ids: artworkIds })
const savedIds = new Set(saved.map((artwork) => artwork.id))
artworks.forEach((artwork) => {
  artwork._isSaved = savedIds.has(artwork.id)
})

// ✅ Field resolver: read the precomputed value; only when the node was
// resolved outside a connection, fall back to a single loader call
isSaved: {
  type: GraphQLBoolean,
  resolve: async (artwork, _args, { savedArtworkLoader }) => {
    if (artwork._isSaved !== undefined) return artwork._isSaved
    const { body } = await savedArtworkLoader(artwork.id)
    return body.is_saved
  },
}
```

Also watch for the error-handling twist: if such a field is non-null (`Boolean!`) and the loader rejects, GraphQL nulls the nearest nullable ancestor and silently drops the node from the response. Wrap the loader call and degrade gracefully instead.

## Mutations: name the OrError field after what it returns

Mutations return a union of `<MutationName>Success` and `<MutationName>Failure`, typed `<MutationName>ResponseOrError`. Name the output field after what the mutation returns, not the generic `responseOrError`:

```ts
// ❌ Generic
outputFields: {
  responseOrError: { type: ResponseOrErrorType, resolve: (result) => result },
}

// ✅ Named after the result: artworkOrError, showOrError, orderOrError
outputFields: {
  artworkOrError: { type: ResponseOrErrorType, resolve: (result) => result },
}
```

## Commands

- Starting: `yarn start`
- Dev server: `yarn dev` or `yarn verbose-dev` for more logs
- Lint: `yarn lint` (fix with `yarn lint:fix`)
- Type check: `yarn type-check`
- Test all: `yarn test`
- Test single file: `yarn jest path/to/file.test.ts`
- Watch tests: `yarn jest --watch`
- Format code: `yarn prettier-project`

## Code Style

- TypeScript with strict typing
- Prettier formatting: no semicolons, double quotes, trailing commas
- Use camelCase for variables, PascalCase for types/interfaces
- Avoid any when possible, but allowed when necessary
- Unused variables should be prefixed with `_`
- Jest for testing with descriptive test names — see [docs/testing.md](docs/testing.md) for query helpers and conventions
- GraphQL queries use the `gql` tag from lib/gql
- Organize imports logically (internal vs external)
- Organize lists (field definitions, enum definitions) alphabetically
  - When inserting into an existing list, maintain alphabetical order even if the list is imperfectly alphabetized
- Follow React best practices for component structure

## Typography

- For user-facing strings (or developer-facing documentation) follow standard typographical style
  - Typographical quotes, e.g “this” and ‘that’ and possessives’ as well
  - En dashes for numerical ranges, e.g. 0–42
  - Ellipses, e.g. this…
