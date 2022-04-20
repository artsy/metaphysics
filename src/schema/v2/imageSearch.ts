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
      type: (GraphQLUpload as unknown) as GraphQLScalarType,
    },
  },
  resolve: async (_root, args, { meLoader }) => {
    if (PRODUCTION_ENV) {
      throw new Error("You cannot use this query for production")
    }

    if (!meLoader) {
      return null
    }

    const imageFile = await args.image

    return {
      filename: imageFile.filename,
      mimetype: imageFile.mimetype,
      encoding: imageFile.encoding,
    }
  },
}
