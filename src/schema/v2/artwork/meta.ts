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
import { getExperimentVariant } from "lib/featureFlags"

const EXPERIMENT_NAME = "diamond_artwork-title-experiment"
const TITLE_MAX_LENGTH = 52 // p95

const isInquireAboutAvailability = (saleMessage) =>
  saleMessage == "Inquire about availability"

const titleWithDate = ({ title, date }) =>
  join(" ", [title, date ? `(${date})` : undefined])

const titleWithDateV2 = ({ title, date }) =>
  join(" ", [truncate(title, TITLE_MAX_LENGTH), date ? `(${date})` : undefined])

export const artistNames = (artwork) =>
  artwork.cultural_maker || map(artwork.artists, "name").join(", ")

const forSaleIndication = (artwork) =>
  artwork.forsale && !isInquireAboutAvailability(artwork.sale_message)
    ? "Available for Sale"
    : undefined

const forSaleIndicationV2 = (artwork) =>
  artwork.forsale && !isInquireAboutAvailability(artwork.sale_message)
    ? "For Sale"
    : "Art & Prints"

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
      resolve: (artwork) => {
        const variant = getExperimentVariant(EXPERIMENT_NAME, {
          artworkId: artwork._id,
        })
        const variantName =
          variant && variant.enabled ? variant.name : undefined
        return generateTitle(artwork, variantName)
      },
    },
  },
})

const Meta: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkMetaType,
  resolve: (x) => x,
}

export default Meta

/**
 * Generates a title for the artwork based on its properties and the
 * experiment variant, resulting in different formats/lengths.
 *
 * ```
 * control   ➡︎ Mevlana Lipp | Cups (2021) | Available for Sale | Artsy
 * variant-a ➡︎ Mevlana Lipp | Cups (2021) | For Sale | Artsy
 * variant-b ➡︎ Mevlana Lipp | Cups | For Sale | Artsy
 * ```
 */
function generateTitle(artwork, variant) {
  switch (variant) {
    case "variant-a":
      return join(" | ", [
        artistNames(artwork),
        titleWithDateV2(artwork),
        forSaleIndicationV2(artwork),
        "Artsy",
      ])
    case "variant-b":
      return join(" | ", [
        artistNames(artwork),
        truncate(artwork.title, TITLE_MAX_LENGTH), // omits date
        forSaleIndicationV2(artwork),
        "Artsy",
      ])
    default:
      return join(" | ", [
        artistNames(artwork),
        titleWithDate(artwork),
        forSaleIndication(artwork),
        "Artsy",
      ])
  }
}
