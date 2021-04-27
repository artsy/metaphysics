import { GraphQLEnumType } from "graphql"

const SHOW_SORTS = {
  END_AT_ASC: { value: "end_at" },
  END_AT_DESC: { value: "-end_at" },
  FEATURED_ASC: { value: "featured" },
  FEATURED_DESC: { value: "-featured" },
  FEATURED_DESC_END_AT_DESC: { value: "-featured,-end_at" },
  NAME_ASC: { value: "name" },
  NAME_DESC: { value: "-name" },
  PARTNER_ASC: { value: "fully_qualified_name" },
  SORTABLE_NAME_ASC: { value: "sortable_name" },
  SORTABLE_NAME_DESC: { value: "-sortable_name" },
  START_AT_ASC: { value: "start_at" },
  START_AT_DESC: { value: "-start_at" },
  UPDATED_AT_ASC: { value: "updated_at" },
  UPDATED_AT_DESC: { value: "-updated_at" },
} as const

const ShowSorts = new GraphQLEnumType({
  name: "ShowSorts",
  values: SHOW_SORTS,
})

export type ShowSortsType = typeof SHOW_SORTS[keyof typeof SHOW_SORTS]["value"]

export default ShowSorts
