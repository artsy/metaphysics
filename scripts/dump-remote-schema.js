/* eslint-disable no-console */

// The below all relate to Convection stitching.
// TODO: Refactor when adding another service.
import fs from "fs"
import path from "path"
import { printSchema } from "graphql/utilities"
import urljoin from "url-join"
import { createHttpLink } from "apollo-link-http"
import { introspectSchema } from "graphql-tools"
import fetch from "node-fetch"

const destination = "src/data"

const httpConvectionLink = createHttpLink({
  fetch,
  uri: urljoin("https://convection-staging.artsy.net/api", "graphql"),
})

introspectSchema(httpConvectionLink).then((schema) => {
  fs.writeFileSync(
    path.join(destination, "convection.graphql"),
    printSchema(schema, { commentDescriptions: true }),
  )
})

const httpLewittLink = createHttpLink({
  fetch,
  uri: urljoin("https://lewitt-api-staging.artsy.net", "graphql"),
})

introspectSchema(httpLewittLink).then((schema) => {
  fs.writeFileSync(
    path.join(destination, "lewitt.graphql"),
    printSchema(schema, { commentDescriptions: true }),
  )
})
