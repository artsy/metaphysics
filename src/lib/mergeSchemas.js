import { mergeSchemas as _mergeSchemas, introspectSchema, makeRemoteExecutableSchema } from "graphql-tools"
import { ApolloLink } from "apollo-link"
import { createHttpLink } from "apollo-link-http"
import { setContext } from "apollo-link-context"
import fetch from "node-fetch"

import localSchema from "../schema"
import { headers as requestIDHeaders } from "./requestIDs"

export function createConvectionLink() {
  const httpLink = createHttpLink({
    fetch,
    uri: `${process.env.CONVECTION_API_BASE}/graphql`,
  })

  const middlewareLink = new ApolloLink((operation, forward) => forward(operation))

  const authMiddleware = setContext((_request, context) => {
    const locals = context.graphqlContext && context.graphqlContext.res.locals
    const tokenLoader = locals && locals.dataLoaders.convectionTokenLoader
    const headers = { ...(locals && requestIDHeaders(locals.requestIDs)) }
    // If a token loader exists for Convection (i.e. this is an authenticated request), use that token to make
    // authenticated requests to Convection.
    if (tokenLoader) {
      return tokenLoader().then(({ token }) => ({
        headers: Object.assign(headers, { Authorization: `Bearer ${token}` }),
      }))
    }
    // Otherwise use no authentication, which is also meant for fetching the service’s (public) schema.
    return { headers }
  })

  return middlewareLink.concat(authMiddleware).concat(httpLink)
}

export async function mergeSchemas() {
  const convectionLink = createConvectionLink()

  const convectionSchema = await makeRemoteExecutableSchema({
    schema: await introspectSchema(convectionLink),
    link: convectionLink,
  })

  const linkTypeDefs = `
    extend type Submission {
      artist: Artist
    }
  `

  return _mergeSchemas({
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
