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

const { PRODUCTION_ENV } = config

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
    if (PRODUCTION_ENV) {
      throw new Error("You cannot use this query for production")
    }

    if (!meLoader) {
      return null
    }

    const { filename, mimetype, encoding, createReadStream } = await image
    const stream = createReadStream()

    await streamToPromise(stream)

    console.log("[debug] responsed")

    return {
      filename,
      mimetype,
      encoding,
    }
  },
}

/**
 * WARNING: Not for production
 * It is more needed for testing `maxFileSize` option for `graphql-upload`
 */
const streamToPromise = (stream) => {
  let content = ""

  return new Promise((resolve, reject) => {
    stream.on("error", (error) => {
      console.log("[debug] error")
      reject(error)
    })

    stream.on("data", (chunk) => {
      content += chunk
      console.log("[debug] chunk", chunk.length)
    })

    stream.on("end", () => {
      console.log("[debug] end")
      resolve(content)
    })

    stream.on("close", () => {
      console.log("[debug] close")
      stream.destroy()
    })
  })
}
