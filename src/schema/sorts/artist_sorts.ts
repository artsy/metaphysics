import { GraphQLEnumType } from "graphql"
import { deprecate } from "lib/deprecation"

const ArtistSorts = {
  type: new GraphQLEnumType({
    name: "ArtistSorts",
    values: {
      sortable_id_asc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "SORTABLE_ID_ASC",
        }),
        value: "sortable_id",
      },
      sortable_id_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "SORTABLE_ID_DESC",
        }),
        value: "-sortable_id",
      },
      trending_desc: {
        deprecationReason: deprecate({
          inVersion: 2,
          preferUsageOf: "TRENDING_DESC",
        }),
        value: "-trending",
      },
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
