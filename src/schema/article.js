import cached from "./fields/cached"
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
  fields: () => {return {
    ...IDFields,
    cached,
    author: {
      type: AuthorType,
      resolve: ({ author }) => {return author},
    },
    channel_id: {
      type: GraphQLString,
    },
    contributing_authors: {
      type: new GraphQLList(AuthorType),
      resolve: ({ contributing_authors }) => {return contributing_authors},
    },
    href: {
      type: GraphQLString,
      resolve: ({ slug }) => {return `/article/${slug}`},
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
      resolve: ({ thumbnail_image }) => {return Image.resolve(thumbnail_image)},
    },
    tier: {
      type: GraphQLInt,
    },
    title: {
      type: GraphQLString,
    },
    updated_at: date,
  }},
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
    {return articleLoader(id)},
}

export default Article
