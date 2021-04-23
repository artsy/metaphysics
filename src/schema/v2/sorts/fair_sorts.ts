import { GraphQLEnumType } from "graphql"

const FAIR_SORTS = {
  CREATED_AT_ASC: { value: "created_at" },
  CREATED_AT_DESC: { value: "-created_at" },
  NAME_ASC: { value: "name" },
  NAME_DESC: { value: "-name" },
  START_AT_ASC: { value: "start_at" },
  START_AT_DESC: { value: "-start_at" },
}

export const FairSorts = {
  type: new GraphQLEnumType({
    name: "FairSorts",
    values: FAIR_SORTS,
  }),
}

export type FairSortsType = typeof FAIR_SORTS[keyof typeof FAIR_SORTS]["value"]

export default FairSorts
