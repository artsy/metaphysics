import { SlugAndInternalIDFields } from "./object_identification"
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
      ...SlugAndInternalIDFields,
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
        deprecationReason: "Use `socials.x` instead",
        type: GraphQLString,
        resolve: ({ twitter_handle }) => twitter_handle,
      },
      instagramHandle: {
        deprecationReason: "Use `socials.instagram` instead",
        type: GraphQLString,
        resolve: ({ instagram_handle }) => instagram_handle,
      },
      socials: {
        type: new GraphQLObjectType({
          name: "AuthorSocials",
          fields: {
            x: {
              type: new GraphQLObjectType({
                name: "AuthorSocialsX",
                fields: {
                  handle: { type: new GraphQLNonNull(GraphQLString) },
                  url: { type: new GraphQLNonNull(GraphQLString) },
                },
              }),
              resolve: ({ twitter_handle }) => {
                if (!twitter_handle) return null
                const handle = twitter_handle.replace("@", "")

                return {
                  handle,
                  url: `https://x.com/${handle}`,
                }
              },
            },
            instagram: {
              type: new GraphQLObjectType({
                name: "AuthorSocialsInstagram",
                fields: {
                  handle: { type: new GraphQLNonNull(GraphQLString) },
                  url: { type: new GraphQLNonNull(GraphQLString) },
                },
              }),
              resolve: ({ instagram_handle }) => {
                if (!instagram_handle) return null
                const handle = instagram_handle.replace("@", "")

                return {
                  handle,
                  url: `https://instagram.com/${handle}`,
                }
              },
            },
          },
        }),
        resolve: ({ twitter_handle, instagram_handle }) => {
          if (!twitter_handle && !instagram_handle) return null

          return { instagram_handle, twitter_handle }
        },
      },
      role: {
        type: GraphQLString,
        resolve: ({ role }) => role,
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
            count: true,
            limit: size,
            offset,
            size,
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
    }
  },
})

export const Author: GraphQLFieldConfig<void, ResolverContext> = {
  type: AuthorType,
  description: "An Editorial author",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The slug or ID of the author",
    },
  },
  resolve: async (_root, { id }, { authorLoader }) => {
    return authorLoader(id)
  },
}

export const AuthorsConnection: GraphQLFieldConfig<void, ResolverContext> = {
  type: connectionWithCursorInfo({
    nodeType: AuthorType,
  }).connectionType,
  args: pageable({
    page: { type: GraphQLInt },
    size: { type: GraphQLInt },
  }),
  resolve: async (_root, args, { authorsLoader }) => {
    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const { results: body, count: totalCount } = await authorsLoader({
      count: true,
      limit: size,
      offset,
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
}
