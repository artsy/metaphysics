import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { compact } from "lodash"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"
import { moneyFieldFromMinor } from "../fields/money"
import {
  ArtnetEditionSetGravityResponse,
  ArtnetEditionSetType,
} from "./artnetEditionSet"
import {
  ArtnetArtworkImageGravityResponse,
  ArtnetArtworkImageType,
} from "./artnetArtworkImage"

export interface ArtnetArtworkGravityResponse {
  id: string
  catalog_artwork_id: string
  artnet_id: string | null
  artnet_artist_id: number | null
  primary_medium: string | null
  additional_mediums: string[]
  materials: string | null
  availability: string | null
  price_currency: string | null
  price_from_minor: number | null
  price_to_minor: number | null
  published: boolean
  // Absent from a Gravity that predates deleting, so both are read with defaults.
  delete_in_flight?: boolean
  last_delete_messages?: string[]
  artnet_edition_sets: ArtnetEditionSetGravityResponse[]
  artnet_artwork_images: ArtnetArtworkImageGravityResponse[]
  separate_image_sets: boolean
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
    artnetArtistId: {
      type: GraphQLString,
      description:
        "Artnet's own artist ID, as last pushed or imported. Null means Gravity has never asserted one, which is what keeps the artwork unpublishable on Artnet.",
      resolve: ({ artnet_artist_id }) => artnet_artist_id?.toString(),
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
    mediums: {
      type: new GraphQLList(GraphQLString),
      description: "Every medium name, primary first.",
      deprecationReason: "Use primaryMedium and additionalMediums",
      resolve: ({ primary_medium, additional_mediums }) =>
        compact([primary_medium, ...(additional_mediums ?? [])]),
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
    deleteInFlight: {
      type: GraphQLBoolean,
      description:
        "Whether a Delete pushed to Artnet has not settled yet. Edits are refused while it has not.",
      resolve: ({ delete_in_flight }) => delete_in_flight ?? false,
    },
    lastDeleteMessages: {
      type: new GraphQLList(GraphQLString),
      description:
        "What came back for the latest Delete pushed to Artnet: Artnet's messages when it settled the Delete without confirming the artwork is gone (the ArtnetArtwork is then kept), or Gravity's reason if it gave up waiting. Empty while the Delete is pending, or when none was pushed.",
      resolve: ({ last_delete_messages }) => last_delete_messages ?? [],
    },
    artnetEditionSets: {
      type: new GraphQLList(ArtnetEditionSetType),
      resolve: ({ artnet_edition_sets }) => artnet_edition_sets ?? [],
    },
    images: {
      type: new GraphQLList(ArtnetArtworkImageType),
      description:
        "The images Artnet holds for this artwork, and those sent to it.",
      resolve: ({ artnet_artwork_images }) => artnet_artwork_images ?? [],
    },
    hasSeparateImageSets: {
      type: GraphQLBoolean,
      description:
        "Artnet holds images the Artsy artwork does not. `syncImages` then does nothing, and Artnet's images change only through `addImageIDs`, `removeImageIDs` and `uploadImageS3Locations` on `updateArtnetArtwork`.",
      resolve: ({ separate_image_sets }) => !!separate_image_sets,
    },
    createdAt: date(),
    updatedAt: date(),
  },
})
