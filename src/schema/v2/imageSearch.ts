import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLScalarType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GraphQLUpload } from "graphql-upload"
import config from "../../config"
import { ReadStream } from "fs-capacitor"

import FormData from "form-data"
import fetch from "node-fetch"

const { TINEYE_API_PASSWORD, TINEYE_API_USERNAME } = config

export const ImageSearchType = new GraphQLObjectType({
  name: "ImageSearch",
  fields: () => ({
    filename: {
      description: "File name",
      type: new GraphQLNonNull(GraphQLString),
    },
    mimetype: {
      description:
        "File MIME type. Provided by the client and can’t be trusted",
      type: new GraphQLNonNull(GraphQLString),
    },
    encoding: {
      description: "File stream transfer encoding",
      type: new GraphQLNonNull(GraphQLString),
    },
  }),
})

export const ImageSearchField: GraphQLFieldConfig<void, ResolverContext> = {
  type: ImageSearchType,
  description: "Get an image info",
  args: {
    image: {
      description: "Image file",
      // TODO: Remove `as unknown` when "graphql" is updated to version 16.x.x
      // Wrong TS declaration for GraphQLScalarType in node_modules/graphql/type/definition.d.ts
      type: new GraphQLNonNull((GraphQLUpload as unknown) as GraphQLScalarType),
    },
  },
  resolve: async (_root, { image }, { meLoader }) => {
    if (!meLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    // Verifying that the token is still valid
    try {
      await meLoader()
    } catch (err) {
      throw new Error("You need to be signed in to perform this action")
    }

    const { filename, mimetype, encoding, createReadStream } = await image
    const stream: ReadStream = createReadStream()
    const form = new FormData()

    form.append("image", stream, {
      filename,
      contentType: mimetype,
    })

    const url = `https://${TINEYE_API_USERNAME}:${TINEYE_API_PASSWORD}@mobileengine.tineye.com/artsy/rest/search/`
    const response = await fetch(url, {
      method: "POST",
      body: form,
    })
    const json = await response.json()

    console.log("[debug] json", json)

    return {
      filename,
      mimetype,
      encoding,
    }
  },
}
