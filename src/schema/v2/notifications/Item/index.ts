import { GraphQLUnionType } from "graphql"
import { AlertNotificationItemType } from "./AlertNotificationItem"
import { ArticleFeaturedArtistNotificationItemType } from "./ArticleFeaturedArtistNotificationItem"
import { ArtworkPublishedNotificationItemType } from "./ArtworkPublishedNotificationItem"
import { ShowOpenedNotificationItemType } from "./ShowOpenedNotificationItem"
import { ViewingRoomPublishedNotificationItemType } from "./ViewingRoomPublishedNotificationItem"
import { PartnerOfferCreatedNotificationItemType } from "./PartnerOfferCreatedNotificationItem"
import { CollectorProfileUpdatePromptNotificationItemType } from "./CollectorProfileUpdatePromptNotificationItem"

export const NotificationItemType = new GraphQLUnionType({
  name: "NotificationItem",
  types: [
    ArtworkPublishedNotificationItemType,
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
        return AlertNotificationItemType.name
      case "ArtworkPublishedActivity":
        return ArtworkPublishedNotificationItemType.name
      case "ArticleFeaturedArtistActivity":
        return ArticleFeaturedArtistNotificationItemType.name
      case "PartnerShowOpenedActivity":
        return ShowOpenedNotificationItemType.name
      case "ViewingRoomPublishedActivity":
        return ViewingRoomPublishedNotificationItemType.name
      case "PartnerOfferCreatedActivity":
        return PartnerOfferCreatedNotificationItemType.name
      case "CollectorProfileUpdatePromptActivity":
        return CollectorProfileUpdatePromptNotificationItemType.name
      default:
        throw new Error("Unknown notification content type")
    }
  },
})
