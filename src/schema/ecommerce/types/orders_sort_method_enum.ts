import { GraphQLEnumType } from "graphql"

export const OrdersSortMethodTypeEnum = new GraphQLEnumType({
  name: "OrdersSortMethodType",
  values: {
    UPDATED_AT_ASC: {
      value: "UPDATED_AT_ASC",
      description:
        "Sort by latest timestamp order was updated in ascending order",
    },
    UPDATED_AT_DESC: {
      value: "UPDATED_AT_DESC",
      description:
        "Sort by latest timestamp order was updated in descending order",
    },
  },
})
