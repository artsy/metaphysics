## Adding a new Microservice to Metaphysics

## Merging Schemas

This is a code-focused version of [GraphQL Stitching 101](http://artsy.github.io/blog/2018/12/11/GraphQL-Stitching/) from the blog.

Let's pretend we're mapping a GraphQL API called `Three Body` but provides its own objects which want to be exposed via Metaphysics.

1. Add your ENV Vars:

   ```sh
   THREE_BODY_APP_ID="xxx_gravity_app_id_xxx"
   THREE_BODY_API_BASE="https://threebody-staging.artsy.net/api"
   ```

   These will need to be added to : Your `.env`, `.env.example`, `.env.test` and
   the live environments, as well as included in `./src/config.ts`

1. Export your schema from your API into Metaphysics

   You should already have a `_schema.graphql` file in the root of your API, move that
   into `src/data` into this repo and rename it to your API name.

1. Create a link: `src/lib/stitching/threeBody/link.ts`

   This is function which is used to connect Metaphysics to your API,

   ```js
   import { createHttpLink } from "apollo-link-http"
   import config from "config"
   import fetch from "node-fetch"
   import urljoin from "url-join"

   import { middlewareLink } from "lib/middlewareLink"
   import { responseLoggerLink } from "../logLinkMiddleware"

   const { KAWS_API_BASE } = config

   export const createThreeBodyLink = () => {
     const httpLink = createHttpLink({
       fetch,
       uri: urljoin(THREE_BODY_API_BASE, "graphql"),
     })

     return middlewareLink
       .concat(responseLoggerLink("ThreeBody"))
       .concat(httpLink)
   }
   ```

   _Note:_ If the new microservice requires gravity JWT authentication, another middleware is required to pass the token coming from client to gravity and get an application token from gravity and pass it to the microservice. Follow Exchange's example [here](https://github.com/artsy/metaphysics/blob/a1a2d507c7ce03c55f44b1165fff51b22446557c/src/lib/stitching/exchange/link.ts#L20-L40) to add a middleware and [here](https://github.com/artsy/metaphysics/blob/bda55ee11a622d9b1a5bd1ac1c2c64cea8888744/src/lib/loaders/loaders_with_authentication/exchange.ts) to add token loader.

1. Create a GraphQL Schema: `src/lib/stitching/threeBody/schema.ts`

   This object represents the GraphQL schema, generated from your `threebody.schema`. In
   order to make your objects fit inside the global namespace. You should prefix both the types, and root fields (e.g. fields on `Query` and `Mutation`.)

   ```javascript
   import { createKawsLink } from "./link"
   import {
     makeRemoteExecutableSchema,
     transformSchema,
     RenameTypes,
     RenameRootFields,
   } from "graphql-tools"
   import { readFileSync } from "fs"

   export const executableThreeBodySchema = () => {
     const threeBodyLink = createThreeBodyLink()
     const threeBodyTypeDefs = readFileSync(
       "src/data/threebody.graphql",
       "utf8"
     )

     // Setup the default Schema
     const schema = makeRemoteExecutableSchema({
       schema: threeBodyTypeDefs,
       link: threeBodyLink,
     })

     // Return the new modified schema
     return transformSchema(schema, [
       new RenameTypes((name) => {
         return `Document${name}`
       }),
       new RenameRootFields(
         (_operation, name) =>
           `document${name.charAt(0).toUpperCase() + name.slice(1)}`
       ),
     ])
   }
   ```

1. Merge your schema into Metaphysics: `src/lib/stitching/mergeSchemas.ts`

   Roughly, this looks something like:

   ```diff
   import { executableGravitySchema } from "lib/stitching/gravity/schema"
   + import { executableThreeBodySchema } from "lib/stitching/threeBody/schema"

   export const incrementalMergeSchemas = (testConfig?: any) => {
     ...
     const schemas = [localSchema] as GraphQLSchema[]

     + const threeBodySchema = executableThreeBodySchema()
     + schemas.push(threeBodySchema)

     ...
   }
   ```

That's it. That's a fully merged schema, everything that's inside your original `_schema.graphql` will be available as a part of the Metaphysics API.

### Debugging

There is an ENV var: `LOG_HTTP_LINKS` which you can turn on which will log to your console the requests made via stitching.

### Stitching

If you want to start transforming, or stitching APIs between each other then consult the [post blog](http://artsy.github.io/blog/2018/12/11/GraphQL-Stitching/) - or read the Exchange stitching implementation.
