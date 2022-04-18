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
import { articleConnection } from "./index"
import { ImageType } from "../image"
import { IDFields } from "../object_identification"
import { pageable } from "relay-cursor-paging"
import { paginationResolver } from "../fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import ArticleSorts from "../sorts/article_sorts"

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
    articlesConnection: {
      description: "A connection of articles related to a partner.",
      type: articleConnection.connectionType,
      args: pageable({ sort: ArticleSorts }),
      resolve: async ({ id }, args, { articlesLoader }) => {
        const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

        const { results: body, count: totalCount } = await articlesLoader({
          channel_id: id,
          count: true,
          limit: size,
          offset,
          published: true,
          sort: args.sort,
        })

        return paginationResolver({
          args,
          body,
          offset,
          page,
          size,
          totalCount,
        })
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
