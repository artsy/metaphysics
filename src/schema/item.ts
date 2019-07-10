import _ from "lodash"
import Artist from "./artist"
import Artwork from "./artwork/index"
import FeaturedLink from "./featured_link"
import Gene from "./gene"
import { GraphQLUnionType } from "graphql"
import { deprecateType } from "lib/deprecation"

export const FeaturedLinkItemType = deprecateType(
  { inVersion: 2, preferUsageOf: "OrderedSetItem" },
  _.create(FeaturedLink.type, {
    name: "FeaturedLinkItem",
    isTypeOf: ({ item_type }) => item_type === "FeaturedLink",
  })
)

export const ArtistItemType = deprecateType(
  { inVersion: 2, preferUsageOf: "OrderedSetItem" },
  _.create(Artist.type, {
    name: "ArtistItem",
    isTypeOf: ({ item_type }) => item_type === "Artist",
  })
)

export const ArtworkItemType = deprecateType(
  { inVersion: 2, preferUsageOf: "OrderedSetItem" },
  _.create(Artwork.type, {
    name: "ArtworkItem",
    isTypeOf: ({ item_type }) => item_type === "Artwork",
  })
)

export const GeneItemType = deprecateType(
  { inVersion: 2, preferUsageOf: "OrderedSetItem" },
  _.create(Gene.type, {
    name: "GeneItem",
    isTypeOf: ({ item_type }) => item_type === "Gene",
  })
)

// Deprecated, remove in v2.
export const ItemType = new GraphQLUnionType({
  name: "Item",
  types: [ArtistItemType, ArtworkItemType, FeaturedLinkItemType, GeneItemType],
})

export default ItemType

export const OrderedSetItemType = new GraphQLUnionType({
  name: "OrderedSetItem",
  types: [FeaturedLink.type, Artist.type, Artwork.type, Gene.type],
  resolveType: value => {
    switch (value.item_type) {
      case "FeaturedLink":
        return FeaturedLink.type
      case "Artist":
        return Artist.type
      case "Artwork":
        return Artwork.type
      case "Gene":
        return Gene.type
      default:
        throw new Error(`Unknown context type: ${value.item_type}`)
    }
  },
})
