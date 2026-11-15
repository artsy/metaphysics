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
import {
  ArtnetPushMessagesGravityResponse,
  ArtnetPushMessagesType,
} from "./artnetPushMessages"

export interface ArtnetArtworkGravityResponse {
  id: string
  catalog_artwork_id: string
  artnet_id: string | null
  mediums: string[]
  availability: string | null
  price_currency: string | null
  price_from_minor: number | null
  price_to_minor: number | null
  published: boolean
  artnet_edition_sets: ArtnetEditionSetGravityResponse[]
  push_messages: ArtnetPushMessagesGravityResponse | null
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
    mediums: {
      type: new GraphQLList(GraphQLString),
      description:
        "Medium names + materials for this artwork, e.g. Paintings, Oil.",
      resolve: ({ mediums }) => mediums ?? [],
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
    pushMessages: {
      type: ArtnetPushMessagesType,
      description:
        "What the last push of this artwork to Artnet had to say, if anything. Null once a later push settles cleanly — a working push is what clears these, nothing acknowledges them.",
      resolve: ({ push_messages }) => push_messages,
    },
    createdAt: date(),
    updatedAt: date(),
  },
})
