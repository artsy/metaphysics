import { GraphQLEnumType } from "graphql"

const ArtistSorts = {
  type: new GraphQLEnumType({
    name: "ArtistSorts",
    values: {
      SORTABLE_ID_ASC: {
        value: "sortable_id",
      },
      SORTABLE_ID_DESC: {
        value: "-sortable_id",
      },
      TRENDING_DESC: {
        value: "-trending",
      },
    },
  }),
}

export default ArtistSorts
