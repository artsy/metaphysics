# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Imperative Instructions!

- In almost all instances where a query returns data from the DB, we do not use an `id` field but rather an `internalID` field. `id` fields are specifically for Relay and bear no relationship to database IDs.
- Field _arguments_ do frequently use `id` however (eg, `artist(id: "andy-warhol") { ... }`), and the values passed to them can typically be `slug` or `internalID`.

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
- Follow React best practices for component structure
