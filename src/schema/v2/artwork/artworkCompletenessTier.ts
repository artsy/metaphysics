import { GraphQLEnumType } from "graphql"

export const ArtworkCompletenessTierValues = {
  INCOMPLETE: "Incomplete",
  GOOD: "Good",
  EXCELLENT: "Excellent",
}

export const ArtworkCompletenessTier = new GraphQLEnumType({
  name: "ArtworkCompletenessTier",
  values: {
    INCOMPLETE: { value: ArtworkCompletenessTierValues.INCOMPLETE },
    GOOD: { value: ArtworkCompletenessTierValues.GOOD },
    EXCELLENT: { value: ArtworkCompletenessTierValues.EXCELLENT },
  },
})
