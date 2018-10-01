import { GraphQLEnumType } from "graphql"

export default new GraphQLEnumType({
  name: "CollectionSorts",
  values: {
    POSITION_ASC: {
      value: "position",
    },
    POSITION_DESC: {
      value: "-position",
    },
  },
})
