import {
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import AuthorType from "schema/v2/author"
import cached from "schema/v2/fields/cached"
import date from "schema/v2/fields/date"
import Image, { normalizeImageData } from "schema/v2/image"
import { IDFields, NodeInterface } from "schema/v2/object_identification"
import { ArticleSectionImageCollection } from "./sections/ArticleSectionImageCollection"
import { ArticleSectionText } from "./sections/ArticleSectionText"
import { ArticleSectionVideo } from "./sections/ArticleSectionVideo"
import { ArticleSectionCallout } from "./sections/ArticleSectionCallout"
import { ArticleSectionEmbed } from "./sections/ArticleSectionEmbed"
import { ArticleSectionImageSet } from "./sections/ArticleSectionImageSet"
import { ArticleSectionSocialEmbed } from "./sections/ArticleSectionSocialEmbed"

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
    byline: {
      type: GraphQLString,
      description:
        'The byline for the article. Defaults to "Artsy Editorial" if no authors are present.',
      resolve: ({ author, contributing_authors }) => {
        const contributingAuthors = contributing_authors
          ?.map((author) => author?.name)
          .join(", ")
          .replace(/,\s([^,]+)$/, " and $1)")

        return contributingAuthors || author?.name || "Artsy Editorial"
      },
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
    sections: {
      type: new GraphQLList(
        new GraphQLUnionType({
          name: "ArticleSectionsType",
          types: [
            ArticleSectionCallout,
            ArticleSectionEmbed,
            ArticleSectionImageCollection,
            ArticleSectionImageSet,
            ArticleSectionSocialEmbed,
            ArticleSectionText,
            ArticleSectionVideo,
          ],
        })
      ),
    },
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
  resolve: async (_root, { id }, { articleLoader }) => {
    const data = await articleLoader(id)
    return data
  },
}

export default Article
export const articleConnection = connectionWithCursorInfo({
  nodeType: ArticleType,
})
