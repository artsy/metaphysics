import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { PartnerArtistConnection, partnersForArtist } from "../partner_artist"
import { pageable } from "relay-cursor-paging"

const ArtistHighlightsType = new GraphQLObjectType({
  name: "ArtistHighlights",
  fields: {
    partners: {
      type: PartnerArtistConnection,
      args: pageable({
        represented_by: {
          type: GraphQLBoolean,
        },
        partner_category: {
          type: new GraphQLList(GraphQLString),
        },
        display_on_partner_profile: {
          type: GraphQLBoolean,
        },
      }),
      resolve: (
        { id: artist_id },
        options,
        _request,
        { rootValue: { partnerArtistsLoader } }
      ) => {
        return partnersForArtist(artist_id, options, partnerArtistsLoader)
      },
    },
  },
})

const ArtistHighlights = {
  type: ArtistHighlightsType,
  resolve: artist => artist,
}

export default ArtistHighlights
