import { GraphQLEnumType } from "graphql"

const ARTIST_GROUP_INDICATORS = {
  INDIVIDUAL: { value: "individual" },
  DUO: { value: "duo" },
  GROUP: { value: "group" },
  N_A: { value: "n/a" },
} as const

export type ArtistGroupIndicator = typeof ARTIST_GROUP_INDICATORS[keyof typeof ARTIST_GROUP_INDICATORS]["value"]

export const ArtistGroupIndicatorEnum = new GraphQLEnumType({
  name: "ArtistGroupIndicator",
  values: ARTIST_GROUP_INDICATORS,
})
