import { GraphQLEnumType } from "graphql"

export const ExhibitionPeriodFormatEnum = new GraphQLEnumType({
  name: "ExhibitionPeriodFormat",
  values: {
    SHORT: {
      value: "short",
      description: "Short formatted period e.g. Feb 25 - May 24, 2015",
    },
    LONG: {
      value: "long",
      description: "Long formatted period e.g. February 25 – May 24, 2015",
    },
  },
})
