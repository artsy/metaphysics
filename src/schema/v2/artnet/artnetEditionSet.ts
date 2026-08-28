import { GraphQLObjectType, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"
import { moneyFieldFromMinor } from "../fields/money"

export interface ArtnetEditionSetGravityResponse {
  id: string
  catalog_edition_set_id: string | null
  artnet_id: number | null // Artnet's numeric editionId.
  label: string | null
  price_from_minor: number | null
  price_to_minor: number | null
  price_currency: string | null
  availability: string | null
  created_at: string
  updated_at: string
}

export const ArtnetEditionSetType = new GraphQLObjectType<
  ArtnetEditionSetGravityResponse,
  ResolverContext
>({
  name: "ArtnetEditionSet",
  description: "An Artnet edition set.",
  fields: {
    ...InternalIDFields,
    catalogEditionSetId: {
      type: GraphQLString,
      description:
        "The corresponding CatalogEditionSet, if this edition set has been matched to one.",
      resolve: ({ catalog_edition_set_id }) => catalog_edition_set_id,
    },
    artnetId: {
      type: GraphQLString,
      resolve: ({ artnet_id }) => artnet_id?.toString(),
    },
    label: { type: GraphQLString },
    priceCurrency: {
      type: GraphQLString,
      resolve: ({ price_currency }) => price_currency,
    },
    priceFrom: moneyFieldFromMinor<ArtnetEditionSetGravityResponse>(
      "price_from_minor"
    ),
    priceTo: moneyFieldFromMinor<ArtnetEditionSetGravityResponse>(
      "price_to_minor"
    ),
    availability: {
      type: GraphQLString,
      description:
        "Artnet availability vocabulary, e.g. For Sale or Price on Request.",
    },
    createdAt: date(),
    updatedAt: date(),
  },
})
