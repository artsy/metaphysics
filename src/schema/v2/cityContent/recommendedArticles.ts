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
import { cityTitlePattern } from "./cityTitlePattern"

const MAX_SHOWS = 10
const TITLE_MATCH_LIMIT = 30
const ARTICLES_PER_PARTNER = 2
// Fetch a few more than the cap, since fair recaps get dropped below.
const PARTNER_FETCH_LIMIT = 6
const RECENCY_MONTHS = 24

interface GravityShow {
  _id: string
  partner?: { _id: string } | null
}

type RecommendedArticle = PositronArticle & {
  published_at?: string
  fair_ids?: string[] | null
}

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

const fetchArticles = (
  label: string,
  params: Record<string, unknown>,
  { articlesLoader }: ResolverContext
): Promise<RecommendedArticle[]> =>
  articlesLoader({
    ...params,
    published: true,
    in_editorial_feed: true,
    sort: "-published_at",
  })
    .then(({ results }) => results)
    .catch((err) => {
      error(`recommendedArticlesConnection: ${label}`, err)
      return []
    })

// Articles whose title names the city. The online city has no name worth matching.
const titleMatches = (
  city: TCity,
  publishedSince: string,
  context: ResolverContext
): Promise<RecommendedArticle[]> =>
  city.slug === "online"
    ? Promise.resolve([])
    : fetchArticles(
        "title",
        {
          q: cityTitlePattern(city),
          published_since: publishedSince,
          limit: TITLE_MATCH_LIMIT,
        },
        context
      )

// The city's running shows, best match for the user first: Gravity ranks them by the user's
// LightFM taste for their artists. Signed out, there is no ranking and no shows.
const rankedShows = async (
  city: TCity,
  { meCityShowsLoader }: ResolverContext
): Promise<GravityShow[]> => {
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

// The galleries behind the ranked shows, in the order of their best show.
const rankedPartnerIds = (shows: GravityShow[]): string[] => [
  ...new Set(
    shows.flatMap((show) => (show.partner?._id ? [show.partner._id] : []))
  ),
]

// Articles editors linked to the city's galleries, minus fair recaps: a "What Sold at Art Basel"
// piece is linked to every exhibiting gallery, and is about the fair's city, not this one.
const partnerArticles = (
  partnerId: string,
  publishedSince: string,
  context: ResolverContext
): Promise<RecommendedArticle[]> =>
  fetchArticles(
    `partner ${partnerId}`,
    {
      partner_id: partnerId,
      published_since: publishedSince,
      limit: PARTNER_FETCH_LIMIT,
    },
    context
  ).then((articles) => articles.filter((article) => !article.fair_ids?.length))

// Title matches come first, newest first. Gallery articles follow in the order Gravity ranked
// the galleries' shows for the user, capped per gallery so one gallery can't fill the list.
const recommendedArticles = async (
  city: TCity,
  context: ResolverContext
): Promise<RecommendedArticle[]> => {
  try {
    // Rounded to the day so the Positron query strings, and with them the memcache keys, hold
    // steady across requests.
    const cutoff = moment().subtract(RECENCY_MONTHS, "months").startOf("day")
    const publishedSince = cutoff.toISOString()

    const [matches, shows, curatedJoins]: [
      RecommendedArticle[],
      GravityShow[],
      GravityCityArticle[]
    ] = await Promise.all([
      titleMatches(city, publishedSince, context),
      rankedShows(city, context),
      // The curated joins only filter articles out, so an outage here shouldn't empty the list.
      context.cityArticlesLoader({ city_slug: city.slug }).catch((err) => {
        error("recommendedArticlesConnection: curated", err)
        return []
      }),
    ])

    const articlesByPartner = await Promise.all(
      rankedPartnerIds(shows).map((partnerId) =>
        partnerArticles(partnerId, publishedSince, context)
      )
    )

    const curatedIds = new Set(curatedJoins.map((join) => join.article_id))
    const eligible = (article: RecommendedArticle) =>
      !curatedIds.has(article.id) &&
      !!article.published_at &&
      !moment(article.published_at).isBefore(cutoff)

    const byId = new Map<string, RankedArticle>()
    const add = (articles: RecommendedArticle[], rank: number) =>
      articles.forEach((article) => {
        const existing = byId.get(article.id)
        if (!existing || rank < existing.rank) {
          byId.set(article.id, { article, rank })
        }
      })

    add(matches.filter(eligible), 0)
    articlesByPartner.forEach((articles, index) =>
      add(articles.filter(eligible).slice(0, ARTICLES_PER_PARTNER), index + 1)
    )

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
    "Recent editorial articles about this city. Articles whose title names the city come first, newest first. Then, for a signed-in user, articles about the galleries showing in the city now, ranked by the user's taste for the galleries' shows, at most two per gallery and leaving out fair recaps. With `includeFeatured`, the city's curated articles come first; without it, they are left out.",
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
