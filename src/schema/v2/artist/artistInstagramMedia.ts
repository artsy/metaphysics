import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import Image, { normalizeImageData } from "schema/v2/image"

const ArtistInstagramMediaType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistInstagramMedia",
  fields: {
    internalID: {
      type: GraphQLString,
      resolve: ({ id }) => id,
    },
    permalink: {
      type: GraphQLString,
      resolve: ({ permalink }) => permalink,
    },
    caption: {
      type: GraphQLString,
      resolve: ({ caption }) => caption,
    },
    image: {
      type: Image.type,
      resolve: ({ media_url }) => normalizeImageData(media_url),
    },
  },
})

export const InstagramMedia: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLList(ArtistInstagramMediaType),
  description: "Instagram media for display on an artist page.",
  args: {
    first: {
      type: GraphQLInt,
      description: "The number of media items to return.",
    },
  },
  resolve: async ({ id }, { first }, { artistInstagramMediaLoader }) => {
    const body = (await artistInstagramMediaLoader(id)) || []
    return typeof first === "number"
      ? body.slice(0, Math.max(0, first))
      : body
  },
}
