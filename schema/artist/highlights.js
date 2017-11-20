import { GraphQLBoolean, GraphQLObjectType, GraphQLList, GraphQLString } from "graphql"
import { assign } from "lodash"
import { PartnerArtistType } from "../partner_artist"

const ArtistHighlightsType = new GraphQLObjectType({
  name: "ArtistHighlights",
  fields: {
    partner_artists: {
      type: new GraphQLList(PartnerArtistType),
      args: {
        represented_by: {
          type: GraphQLBoolean,
        },
        partner_category: {
          type: new GraphQLList(GraphQLString),
        },
      },
      resolve: ({ id }, options, _request, { rootValue: { partnerArtistsLoader } }) => {
        const partnerArtistOptions = assign({ artist_id: id }, options, {})
        return partnerArtistsLoader(partnerArtistOptions)
      },
    },
  },
})

const ArtistHighlights = {
  type: ArtistHighlightsType,
  resolve: artist => artist,
}

export default ArtistHighlights
