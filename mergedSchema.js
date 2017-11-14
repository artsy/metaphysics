import { mergeSchemas, introspectSchema, makeRemoteExecutableSchema } from "graphql-tools"
import { ApolloLink } from "apollo-link"
import { createHttpLink } from "apollo-link-http"
import { setContext } from "apollo-link-context"
import fetch from "node-fetch"

import config from "./config"
import localSchema from "./schema"

function createConvectionLink() {
  const httpLink = createHttpLink({
    fetch,
    uri: process.env.CONVECTION_GRAPH_URL,
  })

  const middlewareLink = new ApolloLink((operation, forward) => forward(operation))

  const authMiddleware = setContext((_request, context) => {
    const loaders = context.graphqlContext && context.graphqlContext.res.locals.dataLoaders
    const tokenLoader = loaders && loaders.convectionTokenLoader

    // If a token loader exists for Convection (i.e. this is an authenticated request), use that token to make
    // authenticated requests to Convection.
    if (tokenLoader) {
      return tokenLoader().then(({ token }) => {
        return {
          ...context.headers,
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      })
    }

    // Otherwise use MP’s XApp token so that on startup MP can fetch Convection’s schema.
    // TODO: Actually enable once Convection supports this.
    return {
      ...context.headers,
      headers: {
        // authorization: `XApp ${config.GRAVITY_XAPP_TOKEN}`,
        authorization: `Bearer ${process.env.CONVECTION_TOKEN}`,
      },
    }
  })

  return middlewareLink.concat(authMiddleware).concat(httpLink)
}

export default async function mergedSchema() {
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
