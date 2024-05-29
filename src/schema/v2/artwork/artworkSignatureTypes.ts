import { GraphQLEnumType } from "graphql"

export const ArtworkSignatureTypeEnum = new GraphQLEnumType({
  name: "ArtworkSignatureTypeEnum",
  values: {
    NOT_SIGNED: {
      value: "not_signed",
      description: "The artwork is not signed",
    },
    HAND_SIGNED_BY_ARTIST: {
      value: "signed_by_artist",
      description: "The artwork is hand signed by the artist",
    },
    SIGNED_IN_PLATE: {
      value: "signed_in_plate",
      description: "The artwork is signed in the plate",
    },
    STAMPED_BY_ARTIST_ESTATE: {
      value: "stamped_by_artist_estate",
      description: "The artwork is stamped by the artist's estate",
    },
    STICKER_LABEL: {
      value: "sticker_label",
      description: "The artwork has a sticker label",
    },
    OTHER: {
      value: "signed_other",
      description: "The artwork has another type of signature",
    },
  },
})

export const transformSignatureFieldsToGravityFields = (
  signatureTypes: undefined | string[]
) => {
  if (!signatureTypes) return {}

  const defaults = ArtworkSignatureTypeEnum.getValues().reduce(
    (acc, { value }) => {
      acc[value] = false
      return acc
    },
    {}
  )

  return signatureTypes.reduce((acc, name) => {
    acc[name] = true
    return acc
  }, defaults)
}
