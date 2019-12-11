import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { partnersForArtist } from "../partner_artist"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"

const ArtistHighlightsType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistHighlights",
  fields: () => {
    const { PartnerArtistConnection } = require("../partnerArtistConnection")
    return {
      partnersConnection: {
        type: PartnerArtistConnection,
        args: pageable({
          representedBy: {
            type: GraphQLBoolean,
          },
          partnerCategory: {
            type: new GraphQLList(GraphQLString),
          },
          displayOnPartnerProfile: {
            type: GraphQLBoolean,
          },
        }),
        resolve: (
          { id: artist_id },
          {
            representedBy,
            partnerCategory,
            displayOnPartnerProfile,
            ...otherOptions
          },
          { partnerArtistsLoader }
        ) => {
          const options: any = {
            represented_by: representedBy,
            partner_category: partnerCategory,
            display_on_partner_profile: displayOnPartnerProfile,
            ...otherOptions,
          }
          return partnersForArtist(artist_id, options, partnerArtistsLoader)
        },
      },
    }
  },
})

const ArtistHighlights: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistHighlightsType,
  resolve: artist => artist,
}

export default ArtistHighlights
