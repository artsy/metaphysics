import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLScalarType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GraphQLUpload } from "graphql-upload"
import { ReadStream } from "fs-capacitor"
import tineye from "../../lib/apis/tineye"

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

    // @ts-ignore
    stream.path = stream?._writeStream?._path

    const response = await tineye("/search", {
      method: "POST",
      formData: {
        image: {
          value: stream,
          options: {
            filename,
            contentType: mimetype,
          },
        },
      },
    })

    console.log("[debug]", response.body)

    return {
      filename,
      mimetype,
      encoding,
    }
  },
}
