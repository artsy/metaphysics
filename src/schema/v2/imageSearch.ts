import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLScalarType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { GraphQLUpload } from "graphql-upload"

export const resolveImageSearch = async (_root, args, context) => {
  const { image } = args
  const { meLoader } = context

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
  const stream = createReadStream()

  try {
    await readDataFromStream(stream)
  } finally {
    stream.destroy()
  }

  return {
    filename,
    mimetype,
    encoding,
  }
}

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
  resolve: resolveImageSearch,
}

/**
 * WARNING: Not for production
 * It's needed for testing `maxFileSize` option for `graphql-upload`
 */
const readDataFromStream = async (stream) => {
  let content = ""

  for await (const chunk of stream) {
    content += chunk
  }

  return content
}
