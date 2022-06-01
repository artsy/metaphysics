import {
  GraphQLBoolean,
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
import { date } from "schema/v2/fields/date"
import Image, { ImageType, normalizeImageData } from "schema/v2/image"
import { IDFields, NodeInterface } from "schema/v2/object_identification"
import { ArticleSectionImageCollection } from "./sections/ArticleSectionImageCollection"
import { ArticleSectionText } from "./sections/ArticleSectionText"
import { ArticleSectionVideo } from "./sections/ArticleSectionVideo"
import { ArticleSectionCallout } from "./sections/ArticleSectionCallout"
import { ArticleSectionEmbed } from "./sections/ArticleSectionEmbed"
import { ArticleSectionImageSet } from "./sections/ArticleSectionImageSet"
import { ArticleSectionSocialEmbed } from "./sections/ArticleSectionSocialEmbed"
import { take } from "lodash"
import { ArticleHero, ArticleLayoutEnum } from "./models"
import { channelType } from "./channel"
import { existyValue } from "lib/helpers"

export const ArticleType = new GraphQLObjectType<any, ResolverContext>({
  name: "Article",
  interfaces: [NodeInterface],
  fields: () => ({
    ...IDFields,
    cached,
    authors: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(AuthorType))),
      resolve: async ({ author_ids }, _args, { authorsLoader }) => {
        if (!author_ids || author_ids.length === 0) return []

        const { results } = await authorsLoader({ ids: author_ids })

        return results
      },
    },
    author: {
      type: AuthorType,
      description:
        'Maps to the "Primary Author" field in Positron. Ultimately this is only supposed to control the article slug',
      deprecationReason: "Use `byline` or `authors` instead",
      resolve: ({ author }) => author,
    },
    byline: {
      type: GraphQLString,
      description:
        'The byline for the article. Defaults to "Artsy Editors" if no authors are present.',
      resolve: async ({ author_ids, author }, _args, { authorsLoader }) => {
        if (!author_ids || author_ids.length === 0) {
          // Attempt to fallback to the `author`. Classic layout articles, for instance, use this.
          return author?.name || "Artsy Editors"
        }

        const { results } = await authorsLoader({ ids: author_ids })

        const names = results.map(({ name }) => name?.trim()).filter(Boolean)
        const byline = names.join(", ").replace(/,\s([^,]+)$/, " and $1")

        return byline || "Artsy Editors"
      },
    },
    channelArticles: {
      args: {
        size: {
          type: GraphQLInt,
          description: "Number of articles to return",
          defaultValue: 12,
        },
      },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArticleType))
      ),
      resolve: async ({ id, channel_id }, args, { articlesLoader }) => {
        if (!channel_id) return []

        const { results } = await articlesLoader({
          channel_id,
          limit: args.size,
          omit: [id],
          published: true,
          sort: "-published_at",
        })

        return results
      },
    },
    channelID: {
      deprecationReason: "Use `channel` instead",
      type: GraphQLString,
      resolve: ({ channel_id }) => channel_id,
    },
    channel: {
      type: channelType,
      resolve: ({ channel_id }, _args, { channelLoader }) => {
        if (!channel_id) return null
        return channelLoader(channel_id)
      },
    },
    contributingAuthors: {
      deprecationReason: "Use `byline` or `authors` instead",
      type: new GraphQLList(AuthorType),
      resolve: ({ contributing_authors }) => contributing_authors,
    },
    description: {
      type: GraphQLString,
    },
    hero: {
      type: ArticleHero,
      resolve: ({ hero_section }) => hero_section,
    },
    href: {
      type: GraphQLString,
      resolve: ({ slug }) => `/article/${slug}`,
    },
    layout: {
      type: new GraphQLNonNull(ArticleLayoutEnum),
    },
    leadParagraph: {
      type: GraphQLString,
      description:
        "Classic layout articles may have a lead paragraph. Returns HTML.",
      resolve: ({ lead_paragraph }) => lead_paragraph,
    },
    keywords: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString))
      ),
      resolve: ({ keywords }) => (keywords ? keywords : []),
    },
    media: {
      type: new GraphQLObjectType({
        name: "ArticleMedia",
        fields: {
          coverImage: {
            type: ImageType,
            resolve: ({ cover_image_url }) => {
              if (!cover_image_url) return null

              // We don't currently save image dimensions, unfortunately
              return {
                image_url: cover_image_url,
              }
            },
          },
          credits: { type: GraphQLString },
          description: { type: GraphQLString },
          duration: {
            type: GraphQLString,
            resolve: ({ duration }) => {
              if (!duration) return null
              const minutes = Math.floor(duration / 60)
              const seconds = duration % 60
              return `${minutes < 10 ? "0" : ""}${minutes}:${
                seconds < 10 ? "0" : ""
              }${seconds}`
            },
          },
          releaseDate: date(({ release_date }) => release_date),
          url: { type: GraphQLString },
        },
      }),
      resolve: ({ media }) => {
        if (!media) return null

        // Positron returns an object with null properties rather than an early null
        if (Object.values(media).filter(Boolean).length === 0) return null

        return media
      },
    },
    newsSource: {
      type: new GraphQLObjectType({
        name: "ArticleNewsSource",
        fields: {
          title: { type: GraphQLString },
          url: { type: GraphQLString },
        },
      }),
      resolve: ({ news_source }) => {
        if (!news_source) return null

        // Positron returns an object with null properties rather than an early null
        if (Object.values(news_source).filter(Boolean).length === 0) return null

        return news_source
      },
    },
    postscript: { type: GraphQLString },
    publishedAt: date(({ published_at }) => published_at),
    relatedArticles: {
      args: {
        size: {
          type: GraphQLInt,
          description: "Number of articles to return",
          defaultValue: 3,
        },
        inVertical: {
          type: GraphQLBoolean,
          description:
            "Enables configuration for loading the type of articles that sit in between full-page articles",
          defaultValue: false,
        },
      },
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(ArticleType))
      ),
      resolve: async (
        { related_article_ids, id, channel_id, tags, vertical, layout },
        args,
        { articlesLoader }
      ) => {
        // When an article is a series, ignore the default size and
        // only return related articles
        if (layout === "series" && related_article_ids?.length > 0) {
          const { results } = await articlesLoader({
            has_published_media: true,
            ids: related_article_ids,
            limit: 25, // Arbitrary limit, possible this needs to be increased
            published: true,
          })

          return results
        }

        const [
          { results: articlesFeed },
          { results: relatedArticles },
        ] = await Promise.all([
          articlesLoader({
            ...(channel_id ? { channel_id } : {}),
            featured: true,
            limit: args.size,
            omit: [id, ...(related_article_ids ?? [])],
            published: true,
            sort: "-published_at",
            tags: tags ?? [],
            ...(args.inVertical
              ? {
                  tags: [],
                  has_published_media: true,
                  in_editorial_feed: true,
                  vertical: vertical?.id,
                }
              : {}),
          }),
          related_article_ids?.length > 0
            ? articlesLoader({
                has_published_media: true,
                ids: related_article_ids,
                limit: args.size,
                published: true,
              })
            : Promise.resolve({ results: [] }),
        ])

        return take([...relatedArticles, ...articlesFeed], args.size)
      },
    },
    searchTitle: {
      type: GraphQLString,
      description: "Title to favor for document titles",
      resolve: ({ search_title }) => existyValue(search_title),
    },
    searchDescription: {
      type: GraphQLString,
      description: "Description to favor for meta description",
      resolve: ({ search_description }) => existyValue(search_description),
    },
    sections: {
      type: new GraphQLNonNull(
        new GraphQLList(
          new GraphQLNonNull(
            new GraphQLUnionType({
              name: "ArticleSections",
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
          )
        )
      ),
      resolve: ({ sections }) =>
        sections
          ? // Filter out any unsupported sections
            sections.filter((section) => {
              return [
                "callout",
                "embed",
                "image_collection",
                "image_set",
                "social_embed",
                "text",
                "video",
              ].includes(section.type)
            })
          : [],
    },
    series: {
      type: new GraphQLObjectType({
        name: "ArticleSeries",
        fields: {
          description: {
            description: "HTML string describing the series",
            type: GraphQLString,
          },
        },
      }),
    },
    seriesArticle: {
      type: ArticleType,
      resolve: async ({ id }, _args, { articlesLoader }) => {
        const { results } = await articlesLoader({
          layout: "series",
          published: true,
        })

        return results.filter((seriesArticle) => {
          return seriesArticle.related_article_ids?.includes(id)
        })[0]
      },
    },
    slug: {
      type: GraphQLString,
    },
    sponsor: {
      type: new GraphQLObjectType({
        name: "ArticleSponsor",
        fields: {
          description: {
            type: GraphQLString,
          },
          subTitle: {
            type: GraphQLString,
            resolve: ({ sub_title }) => sub_title,
          },
          partnerDarkLogo: {
            type: GraphQLString,
            resolve: ({ partner_dark_logo }) => partner_dark_logo,
          },
          partnerLightLogo: {
            type: GraphQLString,
            resolve: ({ partner_light_logo }) => partner_light_logo,
          },
          partnerCondensedLogo: {
            type: GraphQLString,
            resolve: ({ partner_condensed_logo }) => partner_condensed_logo,
          },
          partnerLogoLink: {
            type: GraphQLString,
            resolve: ({ partner_logo_link }) => partner_logo_link,
          },
          pixelTrackingCode: {
            type: GraphQLString,
            resolve: ({ pixel_tracking_code }) => pixel_tracking_code,
          },
        },
      }),
    },
    thumbnailTitle: {
      type: GraphQLString,
      description: "Title to favor for links to article",
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
      resolve: ({ title, search_title, thumbnail_title }) => {
        return title?.trim() || search_title?.trim() || thumbnail_title?.trim()
      },
    },
    updatedAt: date(({ updated_at }) => updated_at),
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
    return articleLoader(id)
  },
}

export default Article

export const articleConnection = connectionWithCursorInfo({
  nodeType: ArticleType,
})
