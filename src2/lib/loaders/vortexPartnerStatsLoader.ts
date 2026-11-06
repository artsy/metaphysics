import DataLoader from "dataloader"
import { groupBy, isNil, omitBy, uniq } from "lodash"

export type PartnerStatsSection =
  | "artwork_published"
  | "artworks_published"
  | "audience"
  | "grouped_stats"
  | "inquiry"
  | "pageview"
  | "pageviews"
  | "ranked_stats"
  | "sales"

export interface PartnerStatsKey {
  partnerId: string
  section: PartnerStatsSection
  /** A Vortex `QueryPeriodEnum` name, e.g. `FOUR_WEEKS`. */
  period: string
  /** Enum name, for `ranked_stats` and `grouped_stats`. */
  objectType?: string
  /** Enum name, for `grouped_stats`. */
  metric?: string
}

type PartnerStatsRESTLoader = (
  section: PartnerStatsSection,
  params: Record<string, unknown>
) => Promise<{ data?: Record<string, any> }>

export type PartnerStatsLoader = (key: PartnerStatsKey) => Promise<any>

const requestKey = ({
  partnerId,
  section,
  objectType,
  metric,
}: PartnerStatsKey) =>
  JSON.stringify([partnerId, section, objectType ?? null, metric ?? null])

/**
 * Loads one period of one partner stats section, batching every period asked
 * for in the same tick into a single Vortex request.
 *
 * Volt asks for each section for several periods at once (aliased fields), and
 * Vortex answers all requested `period[]`s of a section in one response keyed
 * by period. Keys are grouped by partner, section and the section's other
 * params, so e.g. `sales` for FOUR_WEEKS, SIXTEEN_WEEKS and ONE_YEAR is one
 * request. Errors reject every key of the failed request.
 *
 * Create one per request: results are cached for the request's lifetime.
 */
export const createPartnerStatsLoader = (
  restLoader: PartnerStatsRESTLoader
): PartnerStatsLoader => {
  const loader = new DataLoader<PartnerStatsKey, any>(
    async (keys) => {
      const requests = groupBy(keys, requestKey)

      const responses = Object.fromEntries(
        Object.entries(requests).map(([key, group]) => {
          const { partnerId, section, objectType, metric } = group[0]
          const params = omitBy(
            {
              partner_id: partnerId,
              period: uniq(group.map(({ period }) => period)),
              object_type: objectType,
              metric,
            },
            isNil
          )
          return [key, restLoader(section, params)]
        })
      )

      return Promise.all(
        keys.map((key) =>
          responses[requestKey(key)].then(
            ({ data }) => data?.[key.period] ?? null,
            (error) => (error instanceof Error ? error : new Error(error))
          )
        )
      )
    },
    {
      cacheKeyFn: (key) => JSON.stringify([requestKey(key), key.period]),
    }
  )

  return (key) => loader.load(key)
}
