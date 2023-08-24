import { GraphQLNonNull, GraphQLObjectType } from "graphql"
import { IDFields, NodeInterface } from "schema/v2/object_identification"
import { ArtistType } from "schema/v2/artist"
import { PartnerType } from "schema/v2/partner/partner"

export const VerifiedRepresentativeType = new GraphQLObjectType<any, any>({
  name: "VerifiedRepresentative",
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
    }
  },
})
