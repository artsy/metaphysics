import { GraphQLEnumType } from "graphql"

export const FairArtistSortsType = new GraphQLEnumType({
  name: "FairArtistSorts",
  values: {
    NAME_ASC: {
      value: "name",
    },
    NAME_DESC: {
      value: "-name",
    },
  },
})
