import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import { articleConnection } from "./article"
import ArticleSorts, { ArticleSort } from "./sorts/article_sorts"

const ArticlesConnection: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of articles",
  type: articleConnection.connectionType,
  args: pageable({
    sort: ArticleSorts,
    page: { type: GraphQLInt },
  }),
  resolve: async (
    _root,
    args: {
      sort?: ArticleSort
    } & CursorPageable,
    { articlesLoader }
  ) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const articlesLoaderArgs = {
      published: true,
      limit: size,
      count: true,
      offset,
      sort: args.sort,
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
