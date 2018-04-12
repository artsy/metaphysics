import urljoin from "url-join"
import {
  mergeSchemas as _mergeSchemas,
  makeRemoteExecutableSchema,
} from "graphql-tools"
import fs from "fs"
import path from "path"
import { ApolloLink } from "apollo-link"
import { createHttpLink } from "apollo-link-http"
import { setContext } from "apollo-link-context"
import fetch from "node-fetch"

import localSchema from "../schema"
import { headers as requestIDHeaders } from "./requestIDs"

import config from "config"

const { CONVECTION_API_BASE, GRAVITY_GRAPHQL_ENDPOINT } = config

export function createConvectionLink() {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(CONVECTION_API_BASE, "graphql"),
  })

  const middlewareLink = new ApolloLink((operation, forward) =>
    forward(operation)
  )

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

export function createGravityLink() {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(GRAVITY_GRAPHQL_ENDPOINT, "graphql"),
  })

  const middlewareLink = new ApolloLink((operation, forward) =>
    forward(operation)
  )

  const authMiddleware = setContext((_request, context) => {
    const locals = context.graphqlContext && context.graphqlContext.res.locals
    const headers = { ...(locals && requestIDHeaders(locals.requestIDs)) }
    Object.assign(headers, { "X-XAPP-TOKEN": config.GRAVITY_XAPP_TOKEN })
    if (locals.accessToken) {
      Object.assign(headers, { "X-ACCESS-TOKEN": locals.accessToken })
    }
    return { headers }
  })

  return middlewareLink.concat(authMiddleware).concat(httpLink)
}

export async function mergeSchemas() {
  // The below all relate to Convection stitching.
  // TODO: Refactor when adding another service.
  const convectionTypeDefs = fs.readFileSync(
    path.join("src/data/convection.graphql"),
    "utf8"
  )

  const convectionLink = createConvectionLink()

  const convectionSchema = await makeRemoteExecutableSchema({
    schema: convectionTypeDefs,
    link: convectionLink,
  })

  const gravityTypeDefs = fs.readFileSync(
    path.join("src/data/gravity.graphql"),
    "utf8"
  )

  const gravityLink = createGravityLink()

  const gravitySchema = await makeRemoteExecutableSchema({
    schema: gravityTypeDefs,
    link: gravityLink,
  })

  const linkTypeDefs = `
    extend type Submission {
      artist: Artist
    }
  `

  // Add gravity schema first to prefer local MP schema.
  // Add schemas after localSchema to prefer those over MP.
  const mergedSchema = _mergeSchemas({
    schemas: [gravitySchema, localSchema, convectionSchema, linkTypeDefs],
    onTypeConflict: (_leftType, rightType) => {
      console.warn(`[!] Type collision ${rightType}`) // eslint-disable-line no-console
      return rightType
    },
    resolvers: {
      Submission: {
        artist: {
          fragment: `fragment SubmissionArtist on Submission { artist_id }`,
          resolve: (parent, args, context, info) => {
            const id = parent.artist_id
            return info.mergeInfo.delegateToSchema(
              localSchema,
              "query",
              "artist",
              { id },
              context,
              info
            )
          },
        },
      },
    },
  })
  mergedSchema.__allowedLegacyNames = ["__id"]
  return mergedSchema
}
