import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { extractEmbed } from "../article/lib/extractEmbed"

export const FeatureVideo = new GraphQLObjectType<any, ResolverContext>({
  name: "FeatureVideo",
  fields: () => ({
    url: {
      type: new GraphQLNonNull(GraphQLString),
    },
    embed: {
      description: "Only YouTube and Vimeo are supported",
      args: {
        autoPlay: {
          type: GraphQLBoolean,
          defaultValue: false,
        },
      },
      type: GraphQLString,
      resolve: ({ url }, { autoPlay }) => {
        const options = { autoplay: autoPlay ? 1 : 0 }
        return extractEmbed(url, options)
      },
    },
  }),
})
