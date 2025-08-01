import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ImageType } from "./image"
import { markdown } from "schema/v2/fields/markdown"
import initials from "schema/v2/fields/initials"
import {
  connectionWithCursorInfo,
  paginationResolver,
} from "schema/v2/fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

export const AuthorType = new GraphQLObjectType<any, ResolverContext>({
  name: "Author",
  fields: () => {
    const { ArticleType } = require("./article")
    return {
      ...IDFields,
      name: {
        type: new GraphQLNonNull(GraphQLString),
      },
      initials: initials("name"),
      image: {
        type: ImageType,
        resolve: ({ image_url }) => {
          if (!image_url) return null
          return { image_url }
        },
      },
      bio: markdown(({ bio }) => bio),
      twitterHandle: {
        type: GraphQLString,
        resolve: ({ twitter_handle }) => twitter_handle,
      },
      instagramHandle: {
        type: GraphQLString,
        resolve: ({ instagram_handle }) => instagram_handle,
      },
      articles: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(ArticleType))
        ),
        resolve: async ({ id }, _args, { articlesLoader }) => {
          const { results } = await articlesLoader({ author_ids: id })
          return results
        },
      },
      articlesConnection: {
        type: connectionWithCursorInfo({
          nodeType: ArticleType,
          name: "AuthorArticlesConnection",
        }).connectionType,
        args: pageable({
          page: { type: GraphQLInt },
          size: { type: GraphQLInt },
        }),
        resolve: async ({ id }, args, { articlesLoader }) => {
          const { page, size, offset } = convertConnectionArgsToGravityArgs(
            args
          )

          const { results: body, count: totalCount } = await articlesLoader({
            author_ids: id,
            size,
            offset,
            count: true,
          })

          return paginationResolver({
            totalCount,
            offset,
            page,
            size,
            body,
            args,
          })
        },
      },
    }
  },
})

export const Author: GraphQLFieldConfig<void, ResolverContext> = {
  type: AuthorType,
  description: "An Editorial author",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the author",
    },
  },
  resolve: async (_root, { id }, { authorLoader }) => {
    return authorLoader(id)
  },
}
