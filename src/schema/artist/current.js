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
    headline: {
      type: GraphQLString,
    },
    subHeadline: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
  },
})

const showSubHeadline = show => {
  let headline = show.partner.name + "\n"
  if (show.location && show.location.city) {
    headline += show.location.city + ", "
  }
  headline += exhibitionPeriod(show.start_at, show.end_at)
  return headline
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
            headline: "Currently at auction",
            name: sale.name,
            subHeadline: `Live bidding begins at ${liveMoment.format(
              "MMM DD, YYYY"
            )}`,
            image: Image.resolve({ image_versions, image_url }),
          }
        } else if (shows.length > 0) {
          const show = shows[0]
          const { image_versions, image_url } = show
          return {
            headline: "Currently on view",
            name: show.name,
            subHeadline: showSubHeadline(show),
            image: Image.resolve({ image_versions, image_url }),
          }
        } else {
          return null
        }
      })
      .catch(error)
  },
}
