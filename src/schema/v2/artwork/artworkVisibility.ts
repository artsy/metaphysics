import { GraphQLEnumType } from "graphql"

export const ArtworkVisibilityEnumValues = {
  UNLISTED: "unlisted",
  LISTED: "listed",
  TEMPLATE: "template",
}

export const ArtworkVisibility = new GraphQLEnumType({
  name: "Visibility",
  values: {
    UNLISTED: { value: ArtworkVisibilityEnumValues.UNLISTED },
    LISTED: { value: ArtworkVisibilityEnumValues.LISTED },
    TEMPLATE: { value: ArtworkVisibilityEnumValues.TEMPLATE },
  },
})
