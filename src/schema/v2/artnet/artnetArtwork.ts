import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"
import { moneyFieldFromMinor } from "../fields/money"
import {
  ArtnetEditionSetGravityResponse,
  ArtnetEditionSetType,
} from "./artnetEditionSet"

export interface ArtnetArtworkGravityResponse {
  id: string
  catalog_artwork_id: string
  artnet_id: string | null
  primary_medium: string | null
  additional_mediums: string[]
  materials: string | null
  availability: string | null
  price_currency: string | null
  price_from_minor: number | null
  price_to_minor: number | null
  published: boolean
  artnet_edition_sets: ArtnetEditionSetGravityResponse[]
  created_at: string
  updated_at: string
}

export const ArtnetArtworkType = new GraphQLObjectType<
  ArtnetArtworkGravityResponse,
  ResolverContext
>({
  name: "ArtnetArtwork",
  description: "Artnet record of an artwork.",
  fields: {
    ...InternalIDFields,
    artnetId: {
      type: GraphQLString,
      resolve: ({ artnet_id }) => artnet_id,
    },
    primaryMedium: {
      type: GraphQLString,
      description:
        "The medium Art OS shows as this artwork's primary; Artnet itself holds a flat list.",
      resolve: ({ primary_medium }) => primary_medium,
    },
    additionalMediums: {
      type: new GraphQLList(GraphQLString),
      description: "Medium names beyond the primary, in Gravity's order.",
      resolve: ({ additional_mediums }) => additional_mediums ?? [],
    },
    materials: {
      type: GraphQLString,
      description:
        'Free-text materials (e.g. "oil on canvas"), distinct from the medium vocabulary.',
      resolve: ({ materials }) => materials,
    },
    availability: {
      type: GraphQLString,
      description:
        "Artnet availability vocabulary, e.g. For Sale or Price on Request.",
    },
    priceCurrency: {
      type: GraphQLString,
      resolve: ({ price_currency }) => price_currency,
    },
    priceFrom: moneyFieldFromMinor<ArtnetArtworkGravityResponse>(
      "price_from_minor"
    ),
    priceTo: moneyFieldFromMinor<ArtnetArtworkGravityResponse>(
      "price_to_minor"
    ),
    published: {
      type: GraphQLBoolean,
      description: "Whether the artwork is published on Artnet.",
    },
    artnetEditionSets: {
      type: new GraphQLList(ArtnetEditionSetType),
      resolve: ({ artnet_edition_sets }) => artnet_edition_sets ?? [],
    },
    createdAt: date(),
    updatedAt: date(),
  },
})
