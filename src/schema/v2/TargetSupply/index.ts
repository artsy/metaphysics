import { ResolverContext } from "types/graphql"
import { GraphQLObjectType, GraphQLFieldConfig, GraphQLList } from "graphql"
import { ArtistType } from "../artist"
import {
  getMicrofunnelData,
  getTargetSupplyArtists,
} from "../artist/targetSupply/utils/getMicrofunnelData"
import {
  getRecentlySoldArtworksConnection,
  RecentlySoldArtworksConnectionSource,
} from "../types/targetSupply/recentlySoldArtworksConnection"
import { TargetSupplyMicrofunnelMetadata } from "../types/targetSupply/targetSupplyMicrofunnelMetadata"

interface TargetSupplyMicrofunnelItemSource
  extends RecentlySoldArtworksConnectionSource {
  slug: string
}

const TargetSupplyType = new GraphQLObjectType<any, ResolverContext>({
  name: "TargetSupply",
  fields: {
    microfunnel: {
      type: new GraphQLList(
        new GraphQLObjectType<
          TargetSupplyMicrofunnelItemSource,
          ResolverContext
        >({
          name: "TargetSupplyMicrofunnelItem",
          fields: {
            metadata: {
              type: TargetSupplyMicrofunnelMetadata,
            },

            artist: {
              type: ArtistType,
              resolve: async ({ slug }, {}, { artistLoader }) => {
                const artist = await artistLoader(slug)
                return artist
              },
            },

            artworksConnection: getRecentlySoldArtworksConnection(),
          },
        })
      ),
      resolve: (data) => {
        const results = data.microfunnel.map((slug) => {
          const microfunnelData = getMicrofunnelData(`/artist/${slug}`)
          return {
            ...microfunnelData,
            slug,
          }
        })
        return results
      },
    },
  },
})

export const TargetSupply: GraphQLFieldConfig<void, ResolverContext> = {
  type: TargetSupplyType,
  resolve: () => {
    return {
      microfunnel: getTargetSupplyArtists(),
    }
  },
}
