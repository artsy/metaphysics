## Adding a new Microservice to Metaphysics

## Merging Schemas

This is a code-focused version of [GraphQL Stitching 101](http://artsy.github.io/blog/2018/12/11/GraphQL-Stitching/).
Examples use `@graphql-tools/*@v10` and `graphql@16` (see PR #7623 for the upgrade context).

Let's pretend we're mapping a GraphQL API called `Three Body`.

1. Add your ENV Vars:

   ```sh
   THREE_BODY_APP_ID="xxx_gravity_app_id_xxx"
   THREE_BODY_API_BASE="https://threebody-staging.artsy.net/api"
   ```

   Add to `.env`, `.env.example`, `.env.test`, the live environments, and `./src/config.ts`.

1. Export the remote schema and drop it into `src/data/threebody.graphql`.

1. Create the executor: `src/lib/stitching/threeBody/link.ts`

   Stitching consumes an `AsyncExecutor` from `@graphql-tools/utils`. We build one
   with `buildHTTPExecutor` from `@graphql-tools/executor-http` and wrap it in the
   shared `withResponseLogging` helper, which preserves the `LOG_HTTP_LINKS` debug
   output and strips metaphysics-only directives before delegation.

   ```ts
   import { buildHTTPExecutor } from "@graphql-tools/executor-http"
   import config from "config"
   import { headers as requestIDHeaders } from "lib/requestIDs"
   import fetch from "node-fetch"
   import urljoin from "url-join"

   import {
     getResolverContext,
     withResponseLogging,
   } from "../logLinkMiddleware"

   const { THREE_BODY_API_BASE } = config

   export const createThreeBodyExecutor = () =>
     withResponseLogging("ThreeBody", async (request) => {
       const ctx = getResolverContext(request)
       const headers: Record<string, string> = {
         ...(ctx && requestIDHeaders(ctx.requestIDs)),
       }
       return buildHTTPExecutor({
         endpoint: urljoin(THREE_BODY_API_BASE, "graphql"),
         fetch: fetch as any,
         headers,
       })(request)
     })
   ```

   _Need gravity JWT auth?_ See `src/lib/stitching/exchange/link.ts` for the token-
   loader + app-token-exchange pattern, and add a token loader under
   `src/lib/loaders/loaders_with_authentication/`.

1. Create the schema config: `src/lib/stitching/threeBody/schema.ts`

   Export **two** things: a `SubschemaConfig` (consumed by `stitchSchemas` in
   `mergeSchemas.ts`) and an `executableThreeBodySchema()` (used by any per-service
   stitching-environment wiring under `threeBody/v2/`). Both are needed — passing a
   pre-wrapped `GraphQLSchema` directly into `stitchSchemas` causes delegation to
   silently return `null`, because the embedded executor never fires.

   ```ts
   import { readFileSync } from "fs"
   import {
     wrapSchema,
     RenameTypes,
     RenameRootFields,
   } from "@graphql-tools/wrap"
   import type { SubschemaConfig } from "@graphql-tools/delegate"
   import { buildSchema } from "graphql"
   import { createThreeBodyExecutor } from "./link"

   export const threeBodySubschemaConfig = (): SubschemaConfig => {
     const threeBodyTypeDefs = readFileSync(
       "src/data/threebody.graphql",
       "utf8"
     )
     return {
       schema: buildSchema(threeBodyTypeDefs, { assumeValidSDL: true }),
       executor: createThreeBodyExecutor(),
       transforms: [
         new RenameTypes((name) => `ThreeBody${name}`),
         new RenameRootFields(
           (_op, name) =>
             `threeBody${name.charAt(0).toUpperCase() + name.slice(1)}`
         ),
       ],
     }
   }

   export const executableThreeBodySchema = () =>
     wrapSchema(threeBodySubschemaConfig())
   ```

1. Wire it into `src/lib/stitching/mergeSchemas.ts`:

   ```diff
   + import { threeBodySubschemaConfig } from "lib/stitching/threeBody/schema"

     export const incrementalMergeSchemas = (localSchema: GraphQLSchema) => {
       const subschemas: Array<GraphQLSchema | SubschemaConfig> = [localSchema]
       ...
   +   subschemas.push(threeBodySubschemaConfig())
       ...
     }
   ```

   If you need cross-schema resolvers (extensions that stitch ThreeBody fields
   onto metaphysics types), add a `threeBody/v2/stitching.ts` and wire it through
   `useStitchingEnvironment`. Resolver configs use **`selectionSet: "{ ... }"`**,
   not `fragment: "..."` — v10 silently ignores `fragment` and the resolver will
   receive a `source` with no pre-fetched fields. See `exchange/v2/stitching.ts`
   for a worked example.

That's it — everything in your `_schema.graphql` is now available via the merged
metaphysics schema.

### Debugging

`LOG_HTTP_LINKS=1` logs the queries and responses going out via stitching.

### Delegating from a metaphysics resolver

To call a remote subschema from a resolver, import the local wrapper:

```ts
import { delegateToSchema } from "lib/stitching/lib/delegateToSchema"
```

Don't import directly from `@graphql-tools/delegate` — the wrapper preserves the
legacy `info.mergeInfo.delegateToSchema` entry-point used by tests and patches a
v10 variable-typing footgun. See `src/lib/stitching/lib/delegateToSchema.ts`.

### Stitching

For cross-schema field extensions, read `exchange/v2/stitching.ts` or the
[GraphQL Stitching blog post](http://artsy.github.io/blog/2018/12/11/GraphQL-Stitching/).
