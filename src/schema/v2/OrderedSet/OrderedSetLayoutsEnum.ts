import { GraphQLEnumType } from "graphql"

export const OrderedSetLayoutsEnum = new GraphQLEnumType({
  name: "OrderedSetLayouts",
  values: {
    DEFAULT: { value: "default" },
    FULL: { value: "full" },
  },
})
