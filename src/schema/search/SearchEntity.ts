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

const defaultBlockList = ["gallery", "institution"]

export const DEFAULT_ENTITIES = SearchEntity.getValues().filter(
  index => !defaultBlockList.includes(index.value)
)

const suggestBlockList = ["gallery", "institution", "PartnerShow"]

export const SUGGEST_ENTITIES = SearchEntity.getValues().filter(
  index => !suggestBlockList.includes(index.value)
)
