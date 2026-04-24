# Plan: Upgrade graphql 15 → 16

## Reality check (why not 17)

- graphql@17 is **alpha only** (`17.0.0-alpha.14`); `latest` tag is `16.13.2`.
- graphql-yoga@5 peer range: `^15.2.0 || ^16.0.0` — doesn't support 17.
- graphql-middleware@6, graphql-relay@0.10, graphql-parse-resolve-info peer ranges all cap at 16.
- **Target: graphql@16.13.2.** Revisit 17 when it GAs and the ecosystem catches up.

## Stacks on

- Base branch: `feat/migrate-to-graphql-yoga` (PR #7619), like PRs A/B/D.

## Package changes (only if necessary)

Peer-dep analysis shows who needs bumping:

| Package                      | Current | Target     | Why                                                         |
| ---------------------------- | ------- | ---------- | ----------------------------------------------------------- |
| `graphql`                    | 15.8.0  | ^16.13.2   | the upgrade                                                 |
| `graphql-tools`              | 5.0.0   | **remove** | replaced by `@graphql-tools/*` scoped packages              |
| `@graphql-tools/delegate`    | 6.0.10  | ^12.0.14   | v6 peer caps at graphql 15                                  |
| `@graphql-tools/stitch`      | —       | ^10.1.18   | new — provides `stitchSchemas`                              |
| `@graphql-tools/wrap`        | —       | ^11.1.14   | new — provides `wrapSchema`, transforms, `introspectSchema` |
| `@graphql-tools/schema`      | —       | latest     | new — provides `makeExecutableSchema`                       |
| `@graphql-tools/utils`       | —       | latest     | new — provides shared types                                 |
| `@graphql-tools/mock`        | —       | latest     | new — replaces `addMockFunctionsToSchema` (tests)           |
| `graphql-middleware`         | 4.0.3   | ^6.1.35    | v4 peer caps at graphql 14                                  |
| `graphql-relay`              | 0.7.0   | ^0.10.2    | v0.7 peer caps at graphql 15                                |
| `graphql-parse-resolve-info` | 4.13.0  | ^4.14.1    | 4.14 is the latest in the 4.x line (stays on graphql 16)    |
| `graphql-type-json`          | 0.1.4   | ^0.3.2     | 0.1.x is 7+ years old                                       |
| `@graphql-inspector/core`    | 1.27.0  | ^7.1.2     | v1 peer caps at graphql 14                                  |

## Packages that DON'T need bumps

- `graphql-yoga@5.21.0` — already supports graphql 16 ✓
- `@types/graphql`, `@types/graphql-upload` — already compatible with 16 ✓
- `apollo-link`, `apollo-link-http`, `apollo-link-context` — peer-dep range stops at 15, but no hard import of graphql internals; works at runtime with 16. TS peer warning only. Keep.
- `react-relay-network-modern` — no graphql peer. Keep.
- `graphql-depth-limit` — being removed in PR A anyway.

## Code-level breaking changes to handle

### 1. `graphql-tools@5` → scoped packages (biggest chunk)

~20 source files import from `"graphql-tools"`. API renames:

- `makeExecutableSchema` → `@graphql-tools/schema`
- `mergeSchemas` → `stitchSchemas` from `@graphql-tools/stitch`
- `transformSchema(schema, transforms)` → `wrapSchema({ schema, transforms })` from `@graphql-tools/wrap`
- `addMockFunctionsToSchema` → `addMocksToSchema` from `@graphql-tools/mock`
- `GraphQLSchemaWithTransforms` — type removed; just use `GraphQLSchema`
- `WrapQuery`, `FilterRootFields`, `RenameTypes`, etc. → `@graphql-tools/wrap`
- `fieldToConfig` — likely needs to use GraphQLFieldConfig directly or helpers from `@graphql-tools/utils`
- `IResolvers` → `@graphql-tools/utils` or `graphql` directly

Files affected (38 total in `src/lib/stitching/`):

- `src/lib/stitching/mergeSchemas.ts` — wrapper around mergeSchemas
- `src/lib/stitching/{causality,convection,diffusion,exchange,vortex}/schema.ts` — remote schema introspection
- `src/lib/stitching/{...}/v2/stitching.ts` — delegateToSchema / type merging
- `src/lib/stitching/{...}/__tests__/*.ts` — test utilities using mocks
- `src/lib/stitching/exchange/transformers/replaceCommerceDateTimeType.ts`
- `src/lib/__tests__/graphqlTimeoutMiddleware.test.ts`

### 2. `GraphQLError` constructor (low impact)

Only 1 positional-arg usage found: `src/schema/v2/types/formatted_number.ts:15`
`new GraphQLError(error, [ast])` → `new GraphQLError(error, { nodes: [ast] })`
All other `new GraphQLError(...)` calls use the single-string form, which is safe.

### 3. Other deprecated APIs

- `introspectionQuery` constant removed — replace with `getIntrospectionQuery()` if used (grep found no usages).
- `graphql()` signature tightening — grep for sync-style usage (check needed).

### 4. Patch file

`patches/graphql+15.8.0.patch` — will become orphaned. Need to inspect what it does and whether it's needed on 16 (if not, delete; if yes, rewrite for 16).

## Implementation checklist

- [ ] Verify `patches/graphql+15.8.0.patch` — what does it do? still needed?
- [ ] Branch off `feat/migrate-to-graphql-yoga` → `chore/upgrade-graphql-16`
- [ ] Install target package set (`yarn add graphql@^16.13.2 @graphql-tools/schema @graphql-tools/stitch @graphql-tools/wrap @graphql-tools/utils @graphql-tools/mock @graphql-tools/delegate graphql-middleware@^6 graphql-relay@^0.10 graphql-parse-resolve-info@^4.14 graphql-type-json@^0.3 @graphql-inspector/core@^7`)
- [ ] Remove `graphql-tools`, `graphql-depth-limit` (latter already handled by PR A)
- [ ] Rewrite stitching imports file-by-file — 20 prod files + ~10 test files
  - [ ] `mergeSchemas.ts`
  - [ ] `causality/schema.ts` + tests
  - [ ] `convection/schema.ts` + tests
  - [ ] `diffusion/schema.ts` + tests
  - [ ] `exchange/schema.ts` + tests
  - [ ] `vortex/schema.ts` + tests
  - [ ] `exchange/transformers/*`
  - [ ] `graphqlTimeoutMiddleware.test.ts`
- [ ] Fix `GraphQLError` positional args in `formatted_number.ts`
- [ ] Update patch file or delete
- [ ] `yarn type-check`
- [ ] `yarn test` — expect many failures in stitching tests; fix iteratively
- [ ] Smoke test against Force:
  - [ ] auction page loads
  - [ ] shows page loads
  - [ ] order flow (exchange stitching)
  - [ ] consignments (convection stitching)
- [ ] Open PR against `feat/migrate-to-graphql-yoga`

## Risk assessment

- **High**: stitching rewrite. The API surface has shifted substantially. Expect multi-day debugging of subtle behavior changes (how transforms compose, how type merging handles conflicts, how remote executors are plugged in).
- **Medium**: `graphql-middleware@6` — used for `graphqlTimeoutMiddleware`. API is stable but there may be subtle differences in how it wraps resolvers on modern graphql.
- **Low**: everything else. `graphql-relay`, `graphql-parse-resolve-info`, `graphql-type-json` — mostly drop-in.

## Scope I'm NOT including (per "only if necessary")

- Not replacing `apollo-link*` with `@graphql-tools/executor-http`. Apollo Link still works at runtime.
- Not bumping `graphql-yoga` — 5.21 already supports 16.
- Not enabling `@defer`/`@stream`. Separate initiative; has stitching caveats.
- Not upgrading `react-relay-network-modern` — client concern.
- Not touching `@types/graphql` beyond what peer-dep auto-resolution does.

## Open questions for you

1. **One PR or several?** The stitching rewrite is big enough it could be its own sub-PR. But it's tightly coupled to the graphql bump (you can't land one without the other compiling). Lean toward one PR with a clean commit history.
2. **Do you want me to drive the stitching rewrite end-to-end, or just start and let you iterate?** This is the kind of task where human-in-the-loop on subtle behavior calls is valuable.
3. **Any upstream services we should avoid breaking first?** Order flow (Exchange) feels riskiest given how much custom stitching it has.
