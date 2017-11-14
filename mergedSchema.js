import { mergeSchemas, introspectSchema, makeRemoteExecutableSchema } from "graphql-tools"
import { createHttpLink } from "apollo-link-http"
import fetch from "node-fetch"

import localSchema from "./schema"

export default async function mergedSchema() {
  const convectionLink = createHttpLink({
    fetch,
    uri: process.env.CONVECTION_GRAPH_URL,
    headers: {
      Authorization: `Bearer ${process.env.CONVECTION_TOKEN}`,
    },
  })

  const convectionSchema = await makeRemoteExecutableSchema({
    schema: await introspectSchema(convectionLink),
    link: convectionLink,
  })

  return mergeSchemas({
    schemas: [localSchema, convectionSchema],
    // Prefer others over the local MP schema.
    onTypeConflict: (_leftType, rightType) => {
      console.warn(`[!] Type collision ${rightType}`)
      return rightType
    },
  })
}
