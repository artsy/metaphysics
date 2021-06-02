import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import AuthorType from "./author"
import cached from "./fields/cached"
import date from "./fields/date"
import Image, { normalizeImageData } from "./image"
import { IDFields, NodeInterface } from "./object_identification"

export const ArticleType = new GraphQLObjectType<any, ResolverContext>({
  name: "Article",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    cached,
    author: {
      type: AuthorType,
      resolve: ({ author }) => author,
    },
    channelID: {
      type: GraphQLString,
      resolve: ({ channel_id }) => channel_id,
    },
    contributingAuthors: {
      type: new GraphQLList(AuthorType),
      resolve: ({ contributing_authors }) => contributing_authors,
    },
    href: {
      type: GraphQLString,
      resolve: ({ slug }) => `/article/${slug}`,
    },
    publishedAt: date,
    slug: {
      type: GraphQLString,
    },
    thumbnailTitle: {
      type: GraphQLString,
      resolve: ({ thumbnail_title }) => thumbnail_title,
    },
    thumbnailTeaser: {
      type: GraphQLString,
      resolve: ({ thumbnail_teaser }) => thumbnail_teaser,
    },
    thumbnailImage: {
      type: Image.type,
      resolve: ({ thumbnail_image }) => normalizeImageData(thumbnail_image),
    },
    tier: {
      type: GraphQLInt,
    },
    title: {
      type: GraphQLString,
    },
    updatedAt: date,
    vertical: {
      type: GraphQLString,
      resolve: ({ vertical }) => vertical?.name,
    },
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
export const articleConnection = connectionWithCursorInfo({
  nodeType: ArticleType,
})
