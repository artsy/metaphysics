import { GraphQLEnumType } from "graphql"

export const FeatureLayoutsEnum = new GraphQLEnumType({
  name: "FeatureLayouts",
  values: {
    DEFAULT: { value: "default" },
    FULL: { value: "full" },
  },
})
