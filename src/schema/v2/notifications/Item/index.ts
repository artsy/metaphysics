import { GraphQLUnionType } from "graphql"
import { AlertNotificationItemType } from "./AlertNotificationItem"
import { ArticleFeaturedArtistNotificationItemType } from "./ArticleFeaturedArtistNotificationItem"
import { ArtworkPublishedNotificationItemType } from "./ArtworkPublishedNotificationItem"
import { ShowOpenedNotificationItemType } from "./ShowOpenedNotificationItem"
import { ViewingRoomPublishedNotificationItemType } from "./ViewingRoomPublishedNotificationItem"
import { PartnerOfferCreatedNotificationItemType } from "./PartnerOfferCreatedNotificationItem"
import { CollectorProfileUpdatePromptNotificationItemType } from "./CollectorProfileUpdatePromptNotificationItem"
import { ArtworkPriceDroppedNotificationItemType } from "./ArtworkPriceDroppedNotificationItem"

export const NotificationItemType = new GraphQLUnionType({
  name: "NotificationItem",
  types: [
    ArtworkPublishedNotificationItemType,
    ArtworkPriceDroppedNotificationItemType,
    AlertNotificationItemType,
    ArticleFeaturedArtistNotificationItemType,
    ShowOpenedNotificationItemType,
    ViewingRoomPublishedNotificationItemType,
    PartnerOfferCreatedNotificationItemType,
    CollectorProfileUpdatePromptNotificationItemType,
  ],
  resolveType: ({ activity_type }) => {
    switch (activity_type) {
      case "SavedSearchHitActivity":
        return AlertNotificationItemType
      case "ArtworkPublishedActivity":
        return ArtworkPublishedNotificationItemType
      case "ArtworkPriceDroppedActivity":
        return ArtworkPriceDroppedNotificationItemType
      case "ArticleFeaturedArtistActivity":
        return ArticleFeaturedArtistNotificationItemType
      case "PartnerShowOpenedActivity":
        return ShowOpenedNotificationItemType
      case "ViewingRoomPublishedActivity":
        return ViewingRoomPublishedNotificationItemType
      case "PartnerOfferCreatedActivity":
        return PartnerOfferCreatedNotificationItemType
      case "CollectorProfileUpdatePromptActivity":
        return CollectorProfileUpdatePromptNotificationItemType
      default:
        throw new Error("Unknown notification content type")
    }
  },
})
