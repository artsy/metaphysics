import { GraphQLEnumType } from "graphql"

export const SALE_ARTWORKS_SORTS = {
  END_AT_ASC: {
    value: "end_at",
  },
  END_AT_DESC: {
    value: "-end_at",
  },
  POSITION_ASC: {
    value: "position",
  },
} as const

const SaleArtworksSorts = {
  type: new GraphQLEnumType({
    name: "SaleArtworksSorts",
    values: SALE_ARTWORKS_SORTS,
  }),
}

export type SaleArtworksSortsType = typeof SALE_ARTWORKS_SORTS[keyof typeof SALE_ARTWORKS_SORTS]["value"]

export default SaleArtworksSorts
