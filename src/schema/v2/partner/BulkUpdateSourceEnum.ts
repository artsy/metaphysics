import { GraphQLEnumType } from "graphql"

export const BulkUpdateSourceEnum = new GraphQLEnumType({
  name: "BulkUpdateSourceEnum",
  description: "Possible sources of the bulk operation",
  values: {
    ADMIN: { value: "admin" },
    ARTWORKS_LIST: { value: "artworks_list" },
    PARTNER_ARTIST_ARTWORKS_LIST: { value: "partner_artist_artworks_list" },
    SHOW_ARTWORKS_LIST: { value: "show_artworks_list" },
  },
})
