import { GraphQLEnumType } from "graphql"

export const SALE_ARTWORKS_SORTS = {
  BIDDER_POSITIONS_COUNT_ASC: {
    value: "bidder_positions_count",
  },
  BIDDER_POSITIONS_COUNT_DESC: {
    value: "-bidder_positions_count",
  },
  END_AT_ASC: {
    value: "end_at",
  },
  END_AT_DESC: {
    value: "-end_at",
  },
  POSITION_ASC: {
    value: "position",
  },
  POSITION_DESC: {
    value: "-position",
  },
  SEARCHABLE_ESTIMATE_ASC: {
    value: "searchable_estimate",
  },
  SEARCHABLE_ESTIMATE_DESC: {
    value: "-searchable_estimate",
  },
}

const SaleArtworksSorts = {
  type: new GraphQLEnumType({
    name: "SaleArtworksSorts",
    values: SALE_ARTWORKS_SORTS,
  }),
}

export type SaleArtworksSortsType = typeof SALE_ARTWORKS_SORTS[keyof typeof SALE_ARTWORKS_SORTS]["value"]

export default SaleArtworksSorts
