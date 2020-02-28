require("dotenv").config()

// The below all relate to Convection stitching.
// TODO: Refactor when adding another service.
// Also, consider https://github.com/artsy/README/issues/31

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
  uri: urljoin(process.env.CONVECTION_API_BASE, "graphql"),
})

introspectSchema(httpConvectionLink)
  .then(schema => {
    return fs.writeFileSync(
      path.join(destination, "convection.graphql"),
      printSchema(schema, { commentDescriptions: true })
    )
  })
  .catch(error => console.log(error))
