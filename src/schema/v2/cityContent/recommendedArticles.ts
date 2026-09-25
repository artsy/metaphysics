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
import { LOCAL_DISCOVERY_RADIUS_KM } from "schema/v2/city/constants"
import { articleConnection } from "schema/v2/article"
import { PositronArticle } from "schema/v2/article/types"
import { paginationResolver } from "schema/v2/fields/pagination"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { error } from "lib/loggers"
import { GravityCityArticle } from "./types"
import { resolveCityArticleJoins } from "./resolveCityArticleJoins"

const MAX_SHOWS = 10
const MAX_FAIRS = 3
const ARTICLES_PER_SOURCE = 3
const RECENCY_MONTHS = 24

// Gravity's show and fair payloads. Positron validates `show_id` and `fair_id` as Mongo ids and
// matches them against an article's `show_ids` / `fair_ids`.
interface GravityEvent {
  _id: string
}

type RecommendedArticle = PositronArticle & { published_at?: string }

interface RankedArticle {
  article: RecommendedArticle
  rank: number
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

const articlesFor = (
  source: "show_id" | "fair_id",
  id: string,
  { articlesLoader }: ResolverContext
): Promise<RecommendedArticle[]> =>
  articlesLoader({
    [source]: id,
    published: true,
    in_editorial_feed: true,
    sort: "-published_at",
    limit: ARTICLES_PER_SOURCE,
  })
    .then(({ results }) => results)
    .catch((err) => {
      error(`recommendedArticlesConnection: ${source} ${id}`, err)
      return []
    })

// The city's running shows, best match for the user first: Gravity ranks them by the user's
// LightFM taste for their artists.
const rankedShows = async (
  city: TCity,
  { meCityShowsLoader }: ResolverContext
): Promise<GravityEvent[]> => {
  if (!meCityShowsLoader) return []

  try {
    const { body } = await meCityShowsLoader({
      ...cityShowsParams(city, { status: "running" }),
      size: MAX_SHOWS,
    })
    return body.slice(0, MAX_SHOWS)
  } catch (err) {
    // Gravity 404s until me/city_shows is deployed.
    if (err?.statusCode !== 404) {
      error("recommendedArticlesConnection: shows", err)
    }
    return []
  }
}

const runningFairs = async (
  city: TCity,
  { fairsLoader }: ResolverContext
): Promise<GravityEvent[]> => {
  if (city.slug === "online") return []

  try {
    const { body } = await fairsLoader({
      near: city.coords.join(","),
      max_distance: LOCAL_DISCOVERY_RADIUS_KM,
      status: "running",
      sort: "-start_at",
      size: MAX_FAIRS,
    })
    return body.slice(0, MAX_FAIRS)
  } catch (err) {
    error("recommendedArticlesConnection: fairs", err)
    return []
  }
}

// Articles written about the shows and fairs happening in the city now, so every one is about
// the city. Show articles come first, in the order Gravity ranked their shows for the user;
// fair articles follow, since they carry no taste signal.
const recommendedArticles = async (
  city: TCity,
  context: ResolverContext
): Promise<RecommendedArticle[]> => {
  if (!context.meCityShowsLoader) return []

  try {
    const [shows, fairs, curatedJoins]: [
      GravityEvent[],
      GravityEvent[],
      GravityCityArticle[]
    ] = await Promise.all([
      rankedShows(city, context),
      runningFairs(city, context),
      // The curated joins only filter articles out, so an outage here shouldn't empty the list.
      context
        .cityArticlesLoader({ city_slug: city.slug })
        .catch((err) => {
          error("recommendedArticlesConnection: curated", err)
          return []
        }),
    ])

    const sources = [
      ...shows.map((show) => articlesFor("show_id", show._id, context)),
      ...fairs.map((fair) => articlesFor("fair_id", fair._id, context)),
    ]
    if (sources.length === 0) return []

    const articlesBySource = await Promise.all(sources)

    const curatedIds = new Set(curatedJoins.map((join) => join.article_id))
    const cutoff = moment().subtract(RECENCY_MONTHS, "months")
    const byId = new Map<string, RankedArticle>()

    // A fair's articles all share one rank below every show, so they sort by recency alone.
    articlesBySource.forEach((articles, index) => {
      const rank = Math.min(index, shows.length)
      articles.forEach((article) => {
        if (curatedIds.has(article.id)) return
        if (!article.published_at) return
        if (moment(article.published_at).isBefore(cutoff)) return

        const existing = byId.get(article.id)
        if (!existing || rank < existing.rank) {
          byId.set(article.id, { article, rank })
        }
      })
    })

    return [...byId.values()]
      .sort(
        (a, b) =>
          a.rank - b.rank ||
          moment(b.article.published_at).valueOf() -
            moment(a.article.published_at).valueOf()
      )
      .map(({ article }) => article)
  } catch (err) {
    error("recommendedArticlesConnection", err)
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
    "Recent editorial articles about the shows and fairs running in this city now. Show articles come first, ranked by the signed-in user's taste for the shows' artists, then fair articles. With `includeFeatured`, the city's curated articles come first; without it, they are left out. Signed out, only the curated articles are returned.",
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
