import { GraphQLEnumType } from "graphql"

const CollectionArtworkSorts = new GraphQLEnumType({
  name: "CollectionArtworkSorts",
  values: {
    POSITION_ASC: {
      value: "position",
    },
    POSITION_DESC: {
      value: "-position",
    },
    SAVED_AT_ASC: {
      value: "created_at",
    },
    SAVED_AT_DESC: {
      value: "-created_at",
    },
  },
})

export default CollectionArtworkSorts
