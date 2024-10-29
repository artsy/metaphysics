import { GraphQLEnumType } from "graphql"

export const MARKETING_COLLECTIONS_SORTS = {
  CREATED_AT_ASC: {
    value: "created_at",
  },
  CREATED_AT_DESC: {
    value: "-created_at",
  },
  EXPLORE_BY: {
    value: "explore_by",
  },
  UPDATED_AT_ASC: {
    value: "updated_at",
  },
  UPDATED_AT_DESC: {
    value: "-updated_at",
  },
}

export const MarketingCollectionsSorts = new GraphQLEnumType({
  name: "MarketingCollectionsSorts",
  values: MARKETING_COLLECTIONS_SORTS,
})

export type MarketingCollectionsSortsType = typeof MARKETING_COLLECTIONS_SORTS[keyof typeof MARKETING_COLLECTIONS_SORTS]["value"]
