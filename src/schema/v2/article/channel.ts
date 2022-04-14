import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLString,
  GraphQLEnumType,
  GraphQLList,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArticleType } from "./index"
import { ImageType } from "../image"
import { IDFields } from "../object_identification"

enum ChannelType {
  Editorial = "editorial",
  Support = "support",
  Team = "team",
}

export interface Channel {
  id: string
  image_url?: string | null
  links: { text: string; url: string }[]
  name: string
  pinned_articles: { index: number; id: string }[]
  slug?: string | null
  tagline?: string
  type: ChannelType
  user_ids: string[]
}

export const channelType = new GraphQLObjectType<Channel, ResolverContext>({
  name: "Channel",
  fields: () => ({
    ...IDFields,
    image: {
      type: ImageType,
      resolve: ({ image_url }) => {
        if (!image_url) return null

        // We don't currently save image dimensions, unfortunately
        return { image_url }
      },
    },
    links: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(
            new GraphQLObjectType({
              name: "ChannelLink",
              fields: {
                text: { type: new GraphQLNonNull(GraphQLString) },
                url: { type: new GraphQLNonNull(GraphQLString) },
              },
            })
          )
        )
      ),
      resolve: ({ links }) => {
        return links.filter(
          // Links may have empty strings for url or text
          (link) => link.url.length > 0 && link.text.length > 0
        )
      },
    },
    name: { type: GraphQLNonNull(GraphQLString) },
    pinnedArticles: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArticleType))
      ),
      resolve: async ({ pinned_articles }, _args, { articlesLoader }) => {
        const { results } = await articlesLoader({
          ids: pinned_articles.map((article) => article.id),
        })

        return results
      },
    },
    slug: { type: GraphQLString },
    tagline: { type: GraphQLString },
    type: {
      type: GraphQLNonNull(
        new GraphQLEnumType({
          name: "ChannelType",
          values: {
            Editorial: { value: ChannelType.Editorial },
            Support: { value: ChannelType.Support },
            Team: { value: ChannelType.Team },
          },
        })
      ),
    },
  }),
})

export const channel: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: { type: new GraphQLNonNull(GraphQLID) },
  },
  type: new GraphQLNonNull(channelType),
  resolve: (_source, { id }, { channelLoader }) => {
    return channelLoader(id)
  },
}
