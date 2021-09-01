import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
  GraphQLFieldConfig,
} from "graphql"
import Image, { normalizeImageData } from "schema/v2/image"
import { error } from "lib/loggers"
import { dateRange } from "lib/date"
import { ShowType } from "../show"
import { SaleType } from "../sale"
import { formatDate } from "schema/v2/fields/date"
import { ResolverContext } from "types/graphql"

const UnderlyingCurrentEventType = new GraphQLUnionType({
  name: "UnderlyingCurrentEvent",
  types: [ShowType, SaleType],
  resolveType: ({ __type }) => __type,
})

const CurrentEventType = new GraphQLObjectType<any, ResolverContext>({
  name: "CurrentEvent",
  fields: {
    event: {
      type: new GraphQLNonNull(UnderlyingCurrentEventType),
    },
    image: {
      type: Image.type,
    },
    status: {
      type: GraphQLString,
      description: "The state of the event",
    },
    partner: {
      type: GraphQLString,
      description: "Name of the partner associated to the event",
    },
    details: {
      type: GraphQLString,
      description: "Location and date of the event if available",
    },
    name: {
      type: GraphQLString,
      description: "Name of the event",
    },
    href: {
      type: GraphQLString,
      description: "Link to the event",
    },
  },
})

const showDetails = (show) => {
  let status = ""
  if (show.location && show.location.city) {
    status += show.location.city + ", "
  }
  status += dateRange(show.start_at, show.end_at, "UTC")
  return status
}

// TODO: Standardize/move these?
// These currently displays either end_at/live_start_at
// in the client-provided `defaultTimezone`, or in EST/EDT.
const FORMAT = "MMM D h:mm A z"
const DEFAULT_TZ = "America/New_York"

const saleDetails = (sale, timezone) => {
  const dateLabel = formatDate(
    sale.live_start_at || sale.end_at,
    FORMAT,
    timezone
  )

  if (sale.live_start_at) {
    return `Live bidding begins ${dateLabel}`
  }
  return `Bidding ends ${dateLabel}`
}

export const CurrentEvent: GraphQLFieldConfig<
  { id: string },
  ResolverContext
> = {
  type: CurrentEventType,
  resolve: (
    { id },
    _options,
    { relatedSalesLoader, relatedShowsLoader, defaultTimezone }
  ) => {
    return Promise.all([
      relatedShowsLoader({
        artist_id: id,
        at_a_fair: false,
        size: 1,
        status: "running",
        sort: "end_at",
        top_tier: true,
      }),
      relatedSalesLoader({
        artist_id: id,
        sort: "timely_at,name",
        size: 1,
        live: true,
        is_auction: true,
      }),
    ])
      .then(([{ body: shows }, sales]) => {
        if (sales.length > 0) {
          const sale = sales[0]
          const { image_versions, image_url } = sale
          return {
            event: { __type: SaleType, ...sale },
            status: "Currently at auction",
            name: sale.name,
            href: `/auction/${sale.id}`,
            details: saleDetails(sale, defaultTimezone || DEFAULT_TZ),
            image: normalizeImageData({ image_versions, image_url }),
          }
        } else if (shows.length > 0) {
          const show = shows[0]
          const { image_versions, image_url } = show
          return {
            event: {
              __type: ShowType,
              ...show,
            },
            status: "Currently on view",
            name: show.name,
            href: `/show/${show.id}`,
            partner: show.partner.name,
            details: showDetails(show),
            image: normalizeImageData({ image_versions, image_url }),
          }
        } else {
          return null
        }
      })
      .catch(error)
  },
}
