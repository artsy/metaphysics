import { GraphQLEnumType } from "graphql"

export const OrdersSortMethodTypeEnum = new GraphQLEnumType({
  name: "OrdersSortMethodType",
  values: {
    UPDATED_AT_ASC: {
      value: "UPDATED_AT_ASC",
      description:
        "Sort by the timestamp the order was last updated in ascending order",
    },
    UPDATED_AT_DESC: {
      value: "UPDATED_AT_DESC",
      description:
        "Sort by the timestamp the order was last updated in descending order",
    },
    STATE_UPDATED_AT_ASC: {
      value: "STATE_UPDATED_AT_ASC",
      description:
        "Sort by the timestamp the state of order was last updated in ascending order",
    },
    STATE_UPDATED_AT_DESC: {
      value: "STATE_UPDATED_AT_DESC",
      description:
        "Sort by the timestamp the state of order was last updated in descending order",
    },
    STATE_EXPIRES_AT_ASC: {
      value: "STATE_EXPIRES_AT_ASC",
      description:
        "Sort by the timestamp the state of the order expires at in ascending order",
    },
    STATE_EXPIRES_AT_DESC: {
      value: "STATE_EXPIRES_AT_DESC",
      description:
        "Sort by the timestamp the state of the order expires at in a descending order",
    },
  },
})
