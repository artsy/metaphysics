import { GraphQLEnumType } from "graphql"

const CollectionSorts = new GraphQLEnumType({
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

export default CollectionSorts
