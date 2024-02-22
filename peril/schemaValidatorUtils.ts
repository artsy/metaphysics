import {
  introspectionQuery,
  buildClientSchema,
  printSchema,
  buildSchema,
} from "graphql"

/* eslint-disable import/no-unresolved */
// @ts-ignore (this is in the Peril runtime only)
import { diff } from "@graphql-inspector/core"
/* eslint-enable */
import fetch from "node-fetch"

/**
 * Grabs the Schema as SDL from a GraphQL url
 * @param url The URL to grab the schema from
 */
export const downloadSchemaFromURL = async (url: string) => {
  const postBody = {
    query: introspectionQuery,
    operationName: "IntrospectionQuery",
  }

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(postBody),
    headers: {
      "Content-Type": "application/json",
    },
  })
  const { data } = await response.json()
  // commentDescriptions is hidden
  // @ts-ignore
  return printSchema(buildClientSchema(data), { commentDescriptions: true })
}

/**
 * Compares the SDLs and highlights whether there are changes from the version in MP
 * and the version from upstream.
 *
 * @param localSchemaSDL The SDL from inside Metaphysics
 * @param upstreamSchemaSDL The SDL from the external service
 */
export const getBreakingChanges = async (
  localSchemaSDL: string,
  upstreamSchemaSDL: string
): Promise<string[]> => {
  const allChanges = diff(
    buildSchema(localSchemaSDL),
    buildSchema(upstreamSchemaSDL)
  )
  const breakings = allChanges.filter((c) => c.criticality.level === "BREAKING")
  const messages = breakings.map((c) => c.message)
  return messages
}
