import { GraphQLEnumType } from "graphql"

const PartnersSort = {
  type: new GraphQLEnumType({
    name: "PartnersSort",
    values: {
      SORTABLE_ID_ASC: {
        value: "sortable_id",
      },
      SORTABLE_ID_DESC: {
        value: "-sortable_id",
      },
    },
  }),
}

export default PartnersSort
