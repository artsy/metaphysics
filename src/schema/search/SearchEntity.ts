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
    INSTITUTION: {
      value: "institution",
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

export const DefaultEntities = SearchEntity.getValues().filter(
  index => index.value !== "gallery" && index.value !== "institution"
)
