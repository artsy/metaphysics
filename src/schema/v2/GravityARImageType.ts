import {
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"

const GravityImageURLsType = new GraphQLObjectType<any, ResolverContext>({
  name: "GravityImageURLs",
  fields: {
    normalized: {
      type: GraphQLString,
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
        return {
          normalized: image_urls?.normalized,
        }
      },
    },
    width: {
      type: GraphQLInt,
      resolve: ({ original_width }) => original_width,
    },
    height: {
      type: GraphQLInt,
      resolve: ({ original_height }) => original_height,
    },
  },
})
