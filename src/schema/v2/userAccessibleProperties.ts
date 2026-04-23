import { GraphQLEnumType, GraphQLUnionType } from "graphql"
import { connectionWithCursorInfo } from "schema/v2/fields/pagination"
import { ArtworkType } from "./artwork"
import { ProfileType } from "./profile"
import { PartnerType } from "schema/v2/partner/partner"
import { ArtistType } from "./artist"

const userAccessControlPropertiesType = new GraphQLUnionType({
  name: "UserAccessibleProperty",
  types: () => [ArtistType, ArtworkType, ProfileType, PartnerType],
  resolveType: ({ propertyType }) => {
    switch (propertyType) {
      case "Artist":
        return ArtistType.name
      case "Artwork":
        return ArtworkType.name
      case "Partner":
        return PartnerType.name
      case "Profile":
        return ProfileType.name
      default:
        throw new Error(`Unknown context type: ${propertyType}`)
    }
  },
})

export const UserAccessiblePropertiesConnectionType = connectionWithCursorInfo({
  nodeType: userAccessControlPropertiesType,
}).connectionType

export const UserAccessiblePropertiesModelInputType = {
  type: new GraphQLEnumType({
    name: "UserAccessiblePropertyInput",
    values: {
      PARTNER: {
        value: "partner",
      },
      ARTWORK: {
        value: "artwork",
      },
      PROFILE: {
        value: "profile",
      },
      ARTIST: {
        value: "artist",
      },
    },
  }),
}
