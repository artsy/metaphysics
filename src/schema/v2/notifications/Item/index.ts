import { GraphQLUnionType } from "graphql"
import { AlertNotificationItemType } from "./AlertNotificationItem"
import { ArticleFeaturedArtistNotificationItemType } from "./ArticleFeaturedArtistNotificationItem"
import { ArtworkPublishedNotificationItemType } from "./ArtworkPublishedNotificationItem"
import { ShowOpenedNotificationItemType } from "./ShowOpenedNotificationItem"
import { ViewingRoomPublishedNotificationItemType } from "./ViewingRoomPublishedNotificationItem"
import { PartnerOfferCreatedNotificationItemType } from "./PartnerOfferCreatedNotificationItem"
import { CollectorProfileUpdatePromptNotificationItemType } from "./CollectorProfileUpdatePromptNotificationItem"
import { MarketingCollectionHitNotificationItemType } from "./MarketingCollectionHitNotificationItem"
import { SavedArtworkChangesNotificationItemType } from "./SavedArtworkChangesNotificationItem"

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
    MarketingCollectionHitNotificationItemType,
    SavedArtworkChangesNotificationItemType,
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
      case "CollectorProfileUpdatePromptActivity":
        return CollectorProfileUpdatePromptNotificationItemType
      case "MarketingCollectionHitActivity":
        return MarketingCollectionHitNotificationItemType
      case "SavedArtworkChangesActivity":
        return SavedArtworkChangesNotificationItemType
      default:
        throw new Error("Unknown notification content type")
    }
  },
})
