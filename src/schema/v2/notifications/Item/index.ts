import { GraphQLUnionType } from "graphql"
import { AlertNotificationItemType } from "./AlertNotificationItem"
import { ArticleFeaturedArtistNotificationItemType } from "./ArticleFeaturedArtistNotificationItem"
import { ArtworkPublishedNotificationItemType } from "./ArtworkPublishedNotificationItem"
import { ShowOpenedNotificationItemType } from "./ShowOpenedNotificationItem"
import { ViewingRoomPublishedNotificationItemType } from "./ViewingRoomPublishedNotificationItem"
import { PartnerOfferCreatedNotificationItemType } from "./PartnerOfferCreatedNotificationItem"

export const NotificationItemType = new GraphQLUnionType({
  name: "NotificationItem",
  types: [
    ArtworkPublishedNotificationItemType,
    AlertNotificationItemType,
    ArticleFeaturedArtistNotificationItemType,
    ShowOpenedNotificationItemType,
    ViewingRoomPublishedNotificationItemType,
    PartnerOfferCreatedNotificationItemType,
  ],
  resolveType: ({ activity_type }) => {
    switch (activity_type) {
      case "SavedSearchHitActivity":
        return AlertNotificationItemType
      case "ArtworkPublishedActivity":
        return ArtworkPublishedNotificationItemType
      case "ArticleFeaturedArtistActivity":
        return ArticleFeaturedArtistNotificationItemType
      case "PartnerShowOpenedActivity":
        return ShowOpenedNotificationItemType
      case "ViewingRoomPublishedActivity":
        return ViewingRoomPublishedNotificationItemType
      case "PartnerOfferCreatedActivity":
        return PartnerOfferCreatedNotificationItemType
      default:
        throw new Error("Unknown notification content type")
    }
  },
})
