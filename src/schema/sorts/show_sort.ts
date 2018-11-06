import { GraphQLEnumType } from "graphql"

const ShowSort = new GraphQLEnumType({
  name: "ShowSort",
  values: {
    START_AT_ASC: {
      value: "start_at",
    },
    START_AT_DESC: {
      value: "-start_at",
    },
    END_AT_ASC: {
      value: "end_at",
    },
    END_AT_DESC: {
      value: "-end_at",
    },
    UPDATED_AT_ASC: {
      value: "updated_at",
    },
    UPDATED_AT_DESC: {
      value: "-updated_at",
    },
    NAME_ASC: {
      value: "name",
    },
    NAME_DESC: {
      value: "-name",
    },
    FEATURED_ASC: {
      value: "featured",
    },
    FEATURED_DESC: {
      value: "-featured",
    },
    SORTABLE_NAME_ASC: {
      value: "sortable_name",
    },
    SORTABLE_NAME_DESC: {
      value: "-sortable_name",
    },
  },
})

export default ShowSort
