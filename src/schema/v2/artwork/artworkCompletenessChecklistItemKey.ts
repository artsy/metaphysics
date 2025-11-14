import { GraphQLEnumType } from "graphql"

export const ArtworkCompletenessChecklistItemKeyValues = {
  // Ranked by importance
  PUBLISHABLE: "publishable",
  MULTIPLE_IMAGES: "multiple_images",
  PRICE_VISIBILITY: "price_visibility",
  HIGH_RES_IMAGE: "high_res_image",
  CERTIFICATE: "certificate",
  SIGNATURE: "signature",
  DESCRIPTION: "description",
}

export const ArtworkCompletenessChecklistItemKey = new GraphQLEnumType({
  name: "ArtworkCompletenessChecklistItemKey",
  values: {
    PUBLISHABLE: {
      value: ArtworkCompletenessChecklistItemKeyValues.PUBLISHABLE,
    },
    MULTIPLE_IMAGES: {
      value: ArtworkCompletenessChecklistItemKeyValues.MULTIPLE_IMAGES,
    },
    PRICE_VISIBILITY: {
      value: ArtworkCompletenessChecklistItemKeyValues.PRICE_VISIBILITY,
    },
    HIGH_RES_IMAGE: {
      value: ArtworkCompletenessChecklistItemKeyValues.HIGH_RES_IMAGE,
    },
    CERTIFICATE: {
      value: ArtworkCompletenessChecklistItemKeyValues.CERTIFICATE,
    },
    SIGNATURE: { value: ArtworkCompletenessChecklistItemKeyValues.SIGNATURE },
    DESCRIPTION: {
      value: ArtworkCompletenessChecklistItemKeyValues.DESCRIPTION,
    },
  },
})
