import { GraphQLObjectType, GraphQLString } from "graphql"
import Image from "schema/image"
import { error } from "lib/loggers"
import moment from "moment"
import { exhibitionPeriod } from "lib/date"

const CurrentEventType = new GraphQLObjectType({
  name: "CurrentEvent",
  fields: {
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

const showDetails = show => {
  let status = ""
  if (show.location && show.location.city) {
    status += show.location.city + ", "
  }
  status += exhibitionPeriod(show.start_at, show.end_at)
  return status
}

export const CurrentEvent = {
  type: CurrentEventType,
  resolve: (
    { id },
    options,
    _request,
    { rootValue: { relatedSalesLoader, relatedShowsLoader } }
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
          const liveMoment = moment(sale.live_start_at)
          const { image_versions, image_url } = sale
          return {
            status: "Currently at auction",
            name: sale.name,
            href: `/auction/${sale.id}`,
            details: `Live bidding begins at ${liveMoment.format(
              "MMM DD, YYYY"
            )}`,
            image: Image.resolve({ image_versions, image_url }),
          }
        } else if (shows.length > 0) {
          const show = shows[0]
          const { image_versions, image_url } = show
          return {
            status: "Currently on view",
            name: show.name,
            href: `/show/${show.id}`,
            partner: show.partner.name,
            details: showDetails(show),
            image: Image.resolve({ image_versions, image_url }),
          }
        } else {
          return null
        }
      })
      .catch(error)
  },
}
