import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import moment from "moment"
import { ResolverContext } from "types/graphql"
import type { TCity } from "schema/v2/city"
import { cityShowsParams } from "schema/v2/city/cityShowsParams"
import { articleConnection } from "schema/v2/article"
import { paginationResolver } from "schema/v2/fields/pagination"
import { error } from "lib/loggers"
import { GravityCityArticle } from "./types"

const MAX_ARTISTS = 10
const ARTICLES_PER_ARTIST = 3
const RECENCY_MONTHS = 24

interface ScoredArtist {
  artist_id: string
  score: number
}

interface RankedArticle {
  article: { id: string; published_at?: string }
  score: number
}

export const RecommendedArticlesConnectionField: GraphQLFieldConfig<
  TCity,
  ResolverContext,
  { first: number }
> = {
  type: articleConnection.connectionType,
  description:
    "Recent editorial articles about artists showing in this city now, ranked by the signed-in user's taste. Excludes the city's curated articles. Empty when signed out.",
  args: {
    first: { type: GraphQLInt, defaultValue: 4 },
  },
  resolve: async (
    city,
    args,
    { meCityArtistsLoader, cityArticlesLoader, articlesLoader }
  ) => {
    const connection = (articles: unknown[]) =>
      paginationResolver({
        args,
        body: articles,
        offset: 0,
        page: 1,
        size: args.first,
        totalCount: articles.length,
      })

    if (!meCityArtistsLoader || args.first <= 0) return connection([])

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
      if (topArtists.length === 0) return connection([])

      const articlesByArtist = await Promise.all(
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

      const ranked = [...byId.values()]
        .sort(
          (a, b) =>
            b.score - a.score ||
            moment(b.article.published_at).valueOf() -
              moment(a.article.published_at).valueOf()
        )
        .slice(0, args.first)
        .map(({ article }) => article)

      return connection(ranked)
    } catch (err) {
      // Gravity 404s until me/city_artists is deployed.
      if (err?.statusCode !== 404) {
        error("recommendedArticlesConnection", err)
      }
      return connection([])
    }
  },
}
