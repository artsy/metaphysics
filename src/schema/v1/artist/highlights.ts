import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { PartnerArtistConnection, partnersForArtist } from "../partner_artist"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"

const ArtistHighlightsType = new GraphQLObjectType<any, ResolverContext>({
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
      resolve: ({ id: artist_id }, options, { partnerArtistsLoader }) => {
        return partnersForArtist(artist_id, options, partnerArtistsLoader)
      },
    },
  },
})

const ArtistHighlights: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistHighlightsType,
  resolve: (artist) => artist,
}

export default ArtistHighlights
