import { GraphQLEnumType } from "graphql"

const ArtistSorts = {
  type: new GraphQLEnumType({
    name: "ArtistSorts",
    values: {
      sortable_id_asc: {
        deprecationReason: "use capital enums",
        value: "sortable_id",
      },
      sortable_id_desc: {
        deprecationReason: "use capital enums",
        value: "-sortable_id",
      },
      trending_desc: {
        deprecationReason: "use capital enums",
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
