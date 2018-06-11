import cached from "./fields/cached"
import { connectionWithCursorInfo } from "schema/fields/pagination"
import AuthorType from "./author"
import Image from "./image"
import date from "./fields/date"
import { IDFields, NodeInterface } from "./object_identification"
import {
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
} from "graphql"

const ArticleType = new GraphQLObjectType({
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
      resolve: ({ thumbnail_image }) => Image.resolve(thumbnail_image),
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

const Article = {
  type: ArticleType,
  description: "An Article",
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the Article",
    },
  },
  resolve: (root, { id }, request, { rootValue: { articleLoader } }) =>
    articleLoader(id),
}

export default Article

export const articleConnection = connectionWithCursorInfo(ArticleType)
