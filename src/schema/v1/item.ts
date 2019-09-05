import _ from "lodash"
import { ArtistType } from "./artist"
import { ArtworkType } from "./artwork/index"
import { FeaturedLinkType } from "./featured_link"
import { GeneType } from "./gene"
import { GraphQLUnionType } from "graphql"

export const FeaturedLinkItemType = _.create(FeaturedLinkType, {
  name: "FeaturedLinkItem",
  isTypeOf: ({ item_type }) => item_type === "FeaturedLink",
})

export const ArtistItemType = _.create(ArtistType, {
  name: "ArtistItem",
  isTypeOf: ({ item_type }) => item_type === "Artist",
})

export const ArtworkItemType = _.create(ArtworkType, {
  name: "ArtworkItem",
  isTypeOf: ({ item_type }) => item_type === "Artwork",
})

export const GeneItemType = _.create(GeneType, {
  name: "GeneItem",
  isTypeOf: ({ item_type }) => item_type === "Gene",
})

export const ItemType = new GraphQLUnionType({
  name: "Item",
  types: [ArtistItemType, ArtworkItemType, FeaturedLinkItemType, GeneItemType],
})

export default ItemType
