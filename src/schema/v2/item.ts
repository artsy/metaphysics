import { ArtistType } from "./artist"
import { ArtworkType } from "./artwork"
import { FeaturedLinkType } from "./featured_link"
import { GeneType } from "./gene"
import { GraphQLUnionType } from "graphql"

export const OrderedSetItemType = new GraphQLUnionType({
  name: "OrderedSetItem",
  types: [ArtistType, ArtworkType, FeaturedLinkType, GeneType],
  resolveType: value => {
    switch (value.item_type) {
      case "FeaturedLink":
        return FeaturedLinkType
      case "Artist":
        return ArtistType
      case "Artwork":
        return ArtworkType
      case "Gene":
        return GeneType
      default:
        throw new Error(`Unknown context type: ${value.item_type}`)
    }
  },
})
