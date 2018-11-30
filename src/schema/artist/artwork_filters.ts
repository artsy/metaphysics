import { GraphQLEnumType } from "graphql"

const ArtistArtworksFilters = new GraphQLEnumType({
  name: "ArtistArtworksFilters",
  values: {
    IS_FOR_SALE: {
      value: "for_sale",
    },
    IS_NOT_FOR_SALE: {
      value: "not_for_sale",
    },
  },
})

export default ArtistArtworksFilters
