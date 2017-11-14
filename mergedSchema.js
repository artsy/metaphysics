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

  const linkTypeDefs = `
    extend type Submission {
      artist: Artist
    }
  `

  return mergeSchemas({
    schemas: [localSchema, convectionSchema, linkTypeDefs],
    // Prefer others over the local MP schema.
    onTypeConflict: (_leftType, rightType) => {
      console.warn(`[!] Type collision ${rightType}`) // eslint-disable-line no-console
      return rightType
    },
    resolvers: mergeInfo => ({
      Submission: {
        artist: {
          fragment: `fragment SubmissionArtist on Submission { artist_id }`,
          resolve: (parent, args, context, info) => {
            const id = parent.artist_id
            return mergeInfo.delegate("query", "artist", { id }, context, info)
          },
        },
      },
    }),
  })
}
