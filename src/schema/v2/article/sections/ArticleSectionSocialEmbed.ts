import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { extractOEmbed } from "../lib/extractOEmbed"

export const ArticleSectionSocialEmbed = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ArticleSectionSocialEmbed",
  isTypeOf: (section) => {
    return section.type === "social_embed"
  },
  fields: () => ({
    url: {
      type: GraphQLString,
    },
    embed: {
      description: "oEmbed HTML response. Only Twitter is currently supported.",
      type: GraphQLString,
      resolve: async ({ url }) => {
        if (!url) return null
        try {
          const embed = await extractOEmbed(url)
          return embed.html
        } catch (err) {
          return null
        }
      },
    },
  }),
})
