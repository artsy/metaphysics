import { GraphQLEnumType } from "graphql"

const ArtworkVisibility = new GraphQLEnumType({
  name: "Visibility",
  values: {
    UNLISTED: { value: "unlisted" },
    LISTED: { value: "listed" },
  },
})

export default ArtworkVisibility

export const ArtworkVisibilityEnumValues = {
  UNLISTED: "unlisted",
  LISTED: "listed",
}
