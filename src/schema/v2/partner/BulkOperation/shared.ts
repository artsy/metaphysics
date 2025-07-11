import {
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { Availability } from "schema/v2/types/availability"

export const BulkArtworkFilterInput = new GraphQLInputObjectType({
  name: "BulkArtworkFilterInput",
  fields: {
    artistId: {
      type: GraphQLString,
      description: "Filter artworks by artist id",
    },
    availability: {
      type: Availability,
      description: "Filter artworks by availability",
    },
    artworkIds: {
      type: new GraphQLList(GraphQLString),
      description: "Filter artworks with matching ids",
    },
    locationId: {
      type: GraphQLString,
      description: "Filter artworks by location",
    },
    partnerArtistId: {
      type: GraphQLString,
      description: "Filter artworks by partner artist id",
    },
    published: {
      type: GraphQLBoolean,
      description: "Filter artworks by published status",
    },
  },
})
