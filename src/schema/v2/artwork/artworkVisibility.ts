import { GraphQLEnumType } from "graphql"

export const ArtworkVisibility = new GraphQLEnumType({
  name: "Visibility",
  values: {
    UNLISTED: { value: "unlisted" },
    LISTED: { value: "listed" },
  },
})

export const ArtworkVisibilityEnumValues = {
  UNLISTED: "unlisted",
  LISTED: "listed",
}
