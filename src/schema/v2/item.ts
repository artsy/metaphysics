import { GraphQLUnionType } from "graphql"
import { ArtistType } from "./artist"
import { ArtworkType } from "./artwork"
import { FeaturedLinkType } from "./FeaturedLink/featuredLink"
import { GeneType } from "./gene"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { Gravity } from "types/runtime"
import { SaleType } from "./sale"
import { ShowType } from "./show"
import { ProfileType } from "./profile"
import { VideoType } from "./types/Video"

export const OrderedSetItemType = new GraphQLUnionType({
  name: "OrderedSetItem",
  types: [
    ArtistType,
    ArtworkType,
    FeaturedLinkType,
    GeneType,
    ProfileType,
    SaleType,
    ShowType,
    VideoType,
  ],
  resolveType: (
    value: Gravity.OrderedItem & { item_type: Gravity.OrderedSet["item_type"] }
  ) => {
    switch (value.item_type) {
      case "Artist":
        return ArtistType.name
      case "Artwork":
        return ArtworkType.name
      case "FeaturedLink":
        return FeaturedLinkType.name
      case "Gene":
        return GeneType.name
      case "PartnerShow":
        return ShowType.name
      case "Profile":
        return ProfileType.name
      case "Sale":
        return SaleType.name
      case "Video":
        return VideoType.name
      default:
        throw new Error(`Unknown context type: ${value.item_type}`)
    }
  },
})

export const OrderedSetItemConnection = connectionWithCursorInfo({
  nodeType: OrderedSetItemType,
})
