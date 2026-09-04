import { isEmpty, map } from "lodash"
import { join, truncate } from "lib/helpers"
import { getDefault } from "schema/v2/image"
import { setVersion } from "schema/v2/image/normalize"
import {
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const TITLE_MAX_LENGTH = 52 // p95

const isInquireAboutAvailability = (saleMessage) =>
  saleMessage == "Inquire about availability"

const titleWithDate = ({ title, date }) =>
  join(" ", [title || "Untitled", date ? `(${date})` : undefined])

const truncatedTitleWithDate = ({ title, date }) =>
  join(" ", [
    truncate(title || "Untitled", TITLE_MAX_LENGTH),
    date ? `(${date})` : undefined,
  ])

export const artistNames = (artwork) =>
  artwork.cultural_maker || map(artwork.artists, "name").join(", ")

const forSaleIndication = (artwork) =>
  artwork.forsale && !isInquireAboutAvailability(artwork.sale_message)
    ? "For Sale"
    : undefined

const dimensions = (artwork) => artwork.dimensions[artwork.metric]

const partnerDescription = (
  { partner, forsale, sale_message },
  expanded = true
) => {
  const name = partner && partner.name
  if (isEmpty(name)) return undefined

  return forsale && expanded && !isInquireAboutAvailability(sale_message)
    ? `Available for sale from ${name}`
    : `From ${name}`
}

const ArtworkMetaType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtworkMeta",
  fields: {
    description: {
      type: GraphQLString,
      args: {
        limit: {
          type: GraphQLInt,
          defaultValue: 155,
        },
      },
      resolve: (artwork, { limit }) => {
        const fields = [
          partnerDescription(artwork),
          artistNames(artwork),
          titleWithDate(artwork),
          artwork.medium,
          dimensions(artwork),
        ]

        const description = truncate(join(", ", fields), limit)
        return description
      },
    },
    image: {
      type: GraphQLString,
      resolve: ({ images }) => {
        return setVersion(getDefault(images), ["large", "medium", "tall"])
      },
    },
    share: {
      type: GraphQLString,
      resolve: (artwork) => {
        return join(", ", [
          "Check out " + artistNames(artwork),
          titleWithDate(artwork),
          partnerDescription(artwork, false),
        ])
      },
    },
    title: {
      type: GraphQLString,
      resolve: (artwork) =>
        join(" | ", [
          join(" - ", [
            join(" by ", [
              truncatedTitleWithDate(artwork),
              artistNames(artwork),
            ]),
            forSaleIndication(artwork),
          ]),
          "Artsy",
        ]),
    },
  },
})

const Meta: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkMetaType,
  resolve: (x) => x,
}

export default Meta
