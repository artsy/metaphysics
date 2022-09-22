import { GraphQLEnumType } from "graphql"

export const PartnerSearchEntity = new GraphQLEnumType({
  name: "PartnerSearchEntity",
  values: {
    ARTIST: {
      value: "Artist",
    },
    ARTWORK: {
      value: "Artwork",
    },
    SHOW: {
      value: "Show",
    },
  },
})
