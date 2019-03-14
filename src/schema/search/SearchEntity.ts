import { GraphQLEnumType } from "graphql"

export const SearchEntity = new GraphQLEnumType({
  name: "SearchEntity",
  values: {
    ARTIST: {
      value: "Artist",
    },
    ARTWORK: {
      value: "Artwork",
    },
    ARTICLE: {
      value: "Article",
    },
    CITY: {
      value: "City",
    },
    COLLECTION: {
      value: "MarketingCollection",
    },
    FAIR: {
      value: "Fair",
    },
    FEATURE: {
      value: "Feature",
    },
    GALLERY: {
      value: "gallery",
    },
    GENE: {
      value: "Gene",
    },
    PROFILE: {
      value: "Profile",
    },
    SALE: {
      value: "Sale",
    },
    SHOW: {
      value: "PartnerShow",
    },
    TAG: {
      value: "Tag",
    },
  },
})
