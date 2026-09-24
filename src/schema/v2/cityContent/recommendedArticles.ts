import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLString,
} from "graphql"
import moment from "moment"
import { CursorPageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import type { TCity } from "schema/v2/city"
import { cityShowsParams } from "schema/v2/city/cityShowsParams"
import { articleConnection } from "schema/v2/article"
import { PositronArticle } from "schema/v2/article/types"
import { paginationResolver } from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { error } from "lib/loggers"
import { GravityCityArticle } from "./types"
import { resolveCityArticleJoins } from "./resolveCityArticleJoins"

const MAX_ARTISTS = 10
const ARTICLES_PER_ARTIST = 3
const RECENCY_MONTHS = 24

interface ScoredArtist {
  artist_id: string
  score: number
}

type RecommendedArticle = PositronArticle & { published_at?: string }

interface RankedArticle {
  article: RecommendedArticle
  score: number
}

const featuredArticles = async (
  city: TCity,
  { cityArticlesLoader, articlesLoader }: ResolverContext
): Promise<PositronArticle[]> => {
  try {
    const joins = await cityArticlesLoader({ city_slug: city.slug })
    const rows = await resolveCityArticleJoins(joins, articlesLoader)
    return rows
      .sort((a, b) => a.position - b.position)
      .map(({ article }) => article)
  } catch (err) {
    error("recommendedArticlesConnection: featured", err)
    return []
  }
}

const recommendedArticles = async (
  city: TCity,
  { meCityArtistsLoader, cityArticlesLoader, articlesLoader }: ResolverContext
): Promise<RecommendedArticle[]> => {
  if (!meCityArtistsLoader) return []

  try {
    const [scoredArtists, curatedJoins]: [
      ScoredArtist[],
      GravityCityArticle[]
    ] = await Promise.all([
      meCityArtistsLoader({
        ...cityShowsParams(city, { status: "running" }),
        limit: MAX_ARTISTS,
      }),
      cityArticlesLoader({ city_slug: city.slug }),
    ])

    const topArtists = scoredArtists.slice(0, MAX_ARTISTS)
    if (topArtists.length === 0) return []

    const articlesByArtist: RecommendedArticle[][] = await Promise.all(
      topArtists.map(({ artist_id }) =>
        articlesLoader({
          artist_id,
          published: true,
          in_editorial_feed: true,
          sort: "-published_at",
          limit: ARTICLES_PER_ARTIST,
        })
          .then(({ results }) => results)
          .catch((err) => {
            error(`recommendedArticlesConnection: artist ${artist_id}`, err)
            return []
          })
      )
    )

    const curatedIds = new Set(curatedJoins.map((join) => join.article_id))
    const cutoff = moment().subtract(RECENCY_MONTHS, "months")
    const byId = new Map<string, RankedArticle>()

    topArtists.forEach(({ score }, index) => {
      articlesByArtist[index].forEach((article) => {
        if (curatedIds.has(article.id)) return
        if (!article.published_at) return
        if (moment(article.published_at).isBefore(cutoff)) return

        const existing = byId.get(article.id)
        if (!existing || score > existing.score) {
          byId.set(article.id, { article, score })
        }
      })
    })

    return [...byId.values()]
      .sort(
        (a, b) =>
          b.score - a.score ||
          moment(b.article.published_at).valueOf() -
            moment(a.article.published_at).valueOf()
      )
      .map(({ article }) => article)
  } catch (err) {
    // Gravity 404s until me/city_artists is deployed.
    if (err?.statusCode !== 404) {
      error("recommendedArticlesConnection", err)
    }
    return []
  }
}

export const RecommendedArticlesConnectionField: GraphQLFieldConfig<
  TCity,
  ResolverContext,
  { includeFeatured: boolean } & CursorPageable
> = {
  type: articleConnection.connectionType,
  description:
    "Recent editorial articles about artists showing in this city now, ranked by the signed-in user's taste. With `includeFeatured`, the city's curated articles come first; without it, they are left out. Signed out, only the curated articles are returned.",
  args: {
    after: { type: GraphQLString },
    first: { type: GraphQLInt, defaultValue: 4 },
    includeFeatured: {
      type: GraphQLBoolean,
      defaultValue: false,
      description:
        "List the city's curated articles first, in their curated order, then the recommendations.",
    },
  },
  resolve: async (city, args, context) => {
    if (!args.first || args.first <= 0) {
      return paginationResolver({
        args,
        body: [],
        offset: 0,
        page: 1,
        size: args.first ?? 0,
        totalCount: 0,
      })
    }

    const { offset, page, size } = convertConnectionArgsToGravityArgs(args)

    // The list is small and bounded, so build all of it and slice the page.
    const [featured, recommended] = await Promise.all([
      args.includeFeatured ? featuredArticles(city, context) : [],
      recommendedArticles(city, context),
    ])
    const articles = [...featured, ...recommended]

    return paginationResolver({
      args,
      body: articles.slice(offset, offset + size),
      offset,
      page,
      size,
      totalCount: articles.length,
    })
  },
}
