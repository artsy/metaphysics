import { GraphQLEnumType } from "graphql"

export const ARTIST_SORTS = {
  CREATED_AT_ASC: {
    value: "created_at",
  },
  CREATED_AT_DESC: {
    value: "-created_at",
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
} as const

export const ArtistSorts = {
  type: new GraphQLEnumType({
    name: "ArtistSorts",
    values: ARTIST_SORTS,
  }),
}

export type ArtistSort = typeof ARTIST_SORTS[keyof typeof ARTIST_SORTS]["value"]

export default ArtistSorts
