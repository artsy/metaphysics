import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { articleConnection } from "./article"
import { ArticleLayout, ArticleLayoutEnum } from "./article/models"
import ArticleSorts, { ArticleSort } from "./sorts/article_sorts"

const ArticlesConnection: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of articles",
  type: articleConnection.connectionType,
  args: pageable({
    channelId: { type: GraphQLString },
    featured: { type: GraphQLBoolean },
    inEditorialFeed: {
      type: GraphQLBoolean,
      description:
        "Get only articles with 'standard', 'feature', 'series' or 'video' layouts.",
    },
    layout: { type: ArticleLayoutEnum },
    omit: { type: new GraphQLList(new GraphQLNonNull(GraphQLString)) },
    page: { type: GraphQLInt },
    sort: ArticleSorts,
  }),
  resolve: async (
    _root,
    args: {
      channelId?: string
      featured?: boolean
      inEditorialFeed?: boolean
      layout?: ArticleLayout
      omit?: string[]
      sort?: ArticleSort
    } & CursorPageable,
    { articlesLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)
    const { channelId, sort, inEditorialFeed, featured, layout, omit } = args

    const articlesLoaderArgs = {
      count: true,
      channel_id: channelId,
      featured,
      in_editorial_feed: inEditorialFeed,
      layout,
      limit: size,
      offset,
      omit,
      published: true,
      sort,
    }

    const { results, count } = await articlesLoader(articlesLoaderArgs)

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArraySlice(results, args, {
        arrayLength: count,
        sliceStart: offset,
      }),
    }
  },
}

export default ArticlesConnection
