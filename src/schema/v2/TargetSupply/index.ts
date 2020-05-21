import { ResolverContext } from "types/graphql"
import {
  GraphQLObjectType,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ArtistType } from "../artist"
import {
  getMicrofunnelData,
  getTargetSupplyArtists,
} from "../artist/targetSupply/utils/getMicrofunnelData"
import {
  getRecentlySoldArtworksConnection,
  RecentlySoldArtworksConnectionSource,
} from "../types/recentlySoldArtworksConnection"

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
              // TODO: share this shape with the one in ArtistTargetSupply
              type: new GraphQLObjectType<any, ResolverContext>({
                name: "TargetSupplyMicrofunnelItemMetadata",
                fields: {
                  highestRealized: {
                    type: GraphQLString,
                  },
                  realized: {
                    type: GraphQLString,
                  },
                  recentlySoldArtworkIDs: {
                    type: new GraphQLList(GraphQLString),
                  },
                  roundedUniqueVisitors: {
                    type: GraphQLString,
                  },
                  roundedViews: {
                    type: GraphQLString,
                  },
                  str: {
                    type: GraphQLString,
                  },
                  uniqueVisitors: {
                    type: GraphQLString,
                  },
                  views: {
                    type: GraphQLString,
                  },
                },
              }),
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
      // TODO: figure out if we can preserve data between here & the microfunnel resolver above
      microfunnel: getTargetSupplyArtists(),
    }
  },
}
