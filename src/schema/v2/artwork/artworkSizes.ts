import { GraphQLEnumType } from "graphql"

const ArtworkSizes = new GraphQLEnumType({
  name: "ArtworkSizes",
  values: {
    SMALL: {
      value: "small",
    },
    MEDIUM: {
      value: "medium",
    },
    LARGE: {
      value: "large",
    },
  },
})

export default ArtworkSizes
