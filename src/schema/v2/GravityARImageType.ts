import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"

const GravityImageURLsType = new GraphQLObjectType<any, ResolverContext>({
  name: "GravityImageURLs",
  fields: {
    normalized: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
})

export const GravityARImageType = new GraphQLObjectType<any, ResolverContext>({
  name: "GravityARImage",
  fields: {
    internalID: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: ({ id }) => id,
    },
    imageURLs: {
      type: GravityImageURLsType,
      resolve: ({ image_urls }) => {
        // TODO: check implementation
        return {
          normalized: image_urls?.normalized,
        }
      },
    },
    width: {
      type: GraphQLString,
    },
    height: {
      type: GraphQLString,
    },
  },
})
