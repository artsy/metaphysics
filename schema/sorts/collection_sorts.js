import { GraphQLEnumType } from "graphql"

export default {
  type: new GraphQLEnumType({
    name: "CollectionSorts",
    values: {
      POSITION_ASC: {
        value: "position",
      },
      POSITION_DESC: {
        value: "-position",
      },
    },
  }),
  defaultValue: "-position",
}
