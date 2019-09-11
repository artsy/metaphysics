import cached from "./fields/cached"
import { connectionWithCursorInfo } from "schema/v1/fields/pagination"
import AuthorType from "./author"
import Image, { normalizeImageData } from "./image"
import date from "./fields/date"
import { IDFields, NodeInterface } from "./object_identification"
import {
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const ArticleType = new GraphQLObjectType<any, ResolverContext>({
  name: "Article",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    cached,
    author: {
      type: AuthorType,
      resolve: ({ author }) => author,
    },
    channel_id: {
      type: GraphQLString,
    },
    contributing_authors: {
      type: new GraphQLList(AuthorType),
      resolve: ({ contributing_authors }) => contributing_authors,
    },
    href: {
      type: GraphQLString,
      resolve: ({ slug }) => `/article/${slug}`,
    },
    published_at: date,
    slug: {
      type: GraphQLString,
    },
    thumbnail_title: {
      type: GraphQLString,
    },
    thumbnail_teaser: {
      type: GraphQLString,
    },
    thumbnail_image: {
      type: Image.type,
      resolve: ({ thumbnail_image }) => normalizeImageData(thumbnail_image),
    },
    tier: {
      type: GraphQLInt,
    },
    title: {
      type: GraphQLString,
    },
    updated_at: date,
  }),
})

const Article: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArticleType,
  description: "An Article",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Article",
    },
  },
  resolve: (_root, { id }, { articleLoader }) => articleLoader(id),
}

export default Article

export const articleConnection = connectionWithCursorInfo(ArticleType)
