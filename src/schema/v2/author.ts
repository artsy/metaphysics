import { IDFields } from "./object_identification"
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFieldConfig,
  GraphQLList,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ImageType } from "./image"
import { markdown } from "schema/v2/fields/markdown"
import initials from "schema/v2/fields/initials"

export const AuthorType = new GraphQLObjectType<any, ResolverContext>({
  name: "Author",
  fields: () => {
    const { ArticleType } = require("./article")
    return {
      ...IDFields,
      name: {
        type: GraphQLString,
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
      articles: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(ArticleType))
        ),
        resolve: async ({ id }, _args, { articlesLoader }) => {
          const { results } = await articlesLoader({ author_ids: id })
          return results
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
