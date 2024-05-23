import {
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
} from "graphql"
import { IDFields, NodeInterface } from "schema/v2/object_identification"
import { ArtistType } from "schema/v2/artist"
import { PartnerType } from "schema/v2/partner/partner"

export const CareerHighlightType = new GraphQLObjectType<any, any>({
  name: "CareerHighlight",
  interfaces: [NodeInterface],
  fields: () => {
    return {
      ...IDFields,
      artist: {
        type: new GraphQLNonNull(ArtistType),
        resolve: ({ artist_id }, {}, { artistLoader }) => {
          return artistLoader(artist_id)
        },
      },
      partner: {
        type: new GraphQLNonNull(PartnerType),
        resolve: ({ partner_id }, {}, { partnerLoader }) => {
          return partnerLoader(partner_id)
        },
      },
      solo: {
        type: GraphQLBoolean,
        resolve: ({ solo }) => {
          return solo
        },
      },
      group: {
        type: GraphQLBoolean,
        resolve: ({ group }) => {
          return group
        },
      },
      collected: {
        type: GraphQLBoolean,
        resolve: ({ collected }) => {
          return collected
        },
      },
      venue: {
        type: GraphQLNonNull(GraphQLString),
        resolve: ({ venue }) => {
          return venue
        },
      },
    }
  },
})
