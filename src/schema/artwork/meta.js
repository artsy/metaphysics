import { isEmpty, map } from "lodash"
import { join, truncate } from "lib/helpers"
import { getDefault } from "schema/image"
import { setVersion } from "schema/image/normalize"
import { GraphQLInt, GraphQLString, GraphQLObjectType } from "graphql"

const titleWithDate = ({ title, date }) =>
  {return join(" ", [title, date ? `(${date})` : undefined])}

export const artistNames = artwork =>
  {return artwork.cultural_maker || map(artwork.artists, "name").join(", ")}

const forSaleIndication = artwork =>
  {return artwork.forsale ? "Available for Sale" : undefined}

const dimensions = artwork => {return artwork.dimensions[artwork.metric]}

const partnerDescription = ({ partner, forsale }) => {
  const name = partner && partner.name
  if (isEmpty(name)) return undefined
  return forsale ? `Available for sale from ${name}` : `From ${name}`
}

const ArtworkMetaType = new GraphQLObjectType({
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
      resolve: (artwork, { limit }) =>
        {return truncate(
          join(", ", [
            partnerDescription(artwork),
            artistNames(artwork),
            titleWithDate(artwork),
            artwork.medium,
            dimensions(artwork),
          ]),
          limit
        )},
    },
    image: {
      type: GraphQLString,
      resolve: ({ images }) =>
        {return setVersion(getDefault(images), ["large", "medium", "tall"])},
    },
    title: {
      type: GraphQLString,
      resolve: artwork =>
        {return join(" | ", [
          artistNames(artwork),
          titleWithDate(artwork),
          forSaleIndication(artwork),
          "Artsy",
        ])},
    },
  },
})

export default {
  type: ArtworkMetaType,
  resolve: x => {return x},
}
