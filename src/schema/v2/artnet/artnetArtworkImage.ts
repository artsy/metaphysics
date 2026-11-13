import {
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"
import { date } from "../fields/date"

export interface ArtnetArtworkImageGravityResponse {
  id: string
  status: "pending_add" | "on_artnet" | "not_added" | "pending_remove"
  artnet_image_id: string | null
  additional_image_id: string | null
  image_url: string | null
  created_at: string
}

const ArtnetArtworkImageStatusType = new GraphQLEnumType({
  name: "ArtnetArtworkImageStatus",
  values: {
    PENDING_ADD: {
      value: "pending_add",
      description: "Sent to Artnet, which has not confirmed it yet.",
    },
    ON_ARTNET: {
      value: "on_artnet",
      description: "Artnet holds this image.",
    },
    NOT_ADDED: {
      value: "not_added",
      description:
        "Sent to Artnet, which did not add it (for example an image under 500 x 500 px). Send it again with `addImageIDs`.",
    },
    PENDING_REMOVE: {
      value: "pending_remove",
      description:
        "Artnet has been asked to remove it and has not confirmed yet.",
    },
  },
})

export const ArtnetArtworkImageType = new GraphQLObjectType<
  ArtnetArtworkImageGravityResponse,
  ResolverContext
>({
  name: "ArtnetArtworkImage",
  description: "An image of an artwork on Artnet, or one sent to Artnet.",
  fields: {
    ...InternalIDFields,
    status: {
      type: new GraphQLNonNull(ArtnetArtworkImageStatusType),
    },
    imageURL: {
      type: GraphQLString,
      description:
        "Where Artnet serves the image. Null until Artnet holds the image.",
      resolve: ({ image_url }) => image_url,
    },
    artsyImageID: {
      type: GraphQLString,
      description:
        "The artwork image on Artsy that this is a copy of. Null for an image only Artnet has.",
      resolve: ({ additional_image_id }) => additional_image_id,
    },
    createdAt: date(),
  },
})
