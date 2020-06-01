import { isEmpty, map } from "lodash"
import { join, truncate } from "lib/helpers"
import { getDefault } from "schema/v1/image"
import { setVersion } from "schema/v1/image/normalize"
import {
  GraphQLInt,
  GraphQLString,
  GraphQLObjectType,
  GraphQLFieldConfig,
} from "graphql"
import { ResolverContext } from "types/graphql"

const titleWithDate = ({ title, date }) =>
  join(" ", [title, date ? `(${date})` : undefined])

export const artistNames = (artwork) =>
  artwork.cultural_maker || map(artwork.artists, "name").join(", ")

const forSaleIndication = (artwork) =>
  artwork.forsale ? "Available for Sale" : undefined

const dimensions = (artwork) => artwork.dimensions[artwork.metric]

const partnerDescription = ({ partner, forsale }, expanded = true) => {
  const name = partner && partner.name
  if (isEmpty(name)) return undefined
  return forsale && expanded
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
      resolve: (artwork) => {
        return join(" | ", [
          artistNames(artwork),
          titleWithDate(artwork),
          forSaleIndication(artwork),
          "Artsy",
        ])
      },
    },
  },
})

const Meta: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkMetaType,
  resolve: (x) => x,
}

export default Meta
