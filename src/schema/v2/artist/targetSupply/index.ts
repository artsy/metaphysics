import { ResolverContext } from "types/graphql"
import { getArtistMicrofunnelMetadata } from "./utils/getMicrofunnelData"

import { GraphQLObjectType, GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { getRecentlySoldArtworksConnection } from "schema/v2/types/targetSupply/recentlySoldArtworksConnection"
import { TargetSupplyMicrofunnelMetadata } from "schema/v2/types/targetSupply/targetSupplyMicrofunnelMetadata"

const ArtistTargetSupplyType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistTargetSupply",
  fields: {
    isTargetSupply: {
      description: "True if artist is in target supply list.",
      type: GraphQLBoolean,
      resolve: (artist) => artist.target_supply,
    },
    isInMicrofunnel: {
      description: "True if an artist is in the microfunnel list.",
      type: GraphQLBoolean,
      resolve: (artist) =>
        Boolean(getArtistMicrofunnelMetadata(`/artist/${artist.id}`)),
    },
    microfunnel: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ArtistTargetSupplyMicrofunnel",
        fields: () => ({
          /**
           * This field is resolved by parsing static CSVtoJSON data.
           * @see src/schema/v2/artist/targetSupply/utils/getMicrofunnelData.ts
           */
          metadata: {
            type: TargetSupplyMicrofunnelMetadata,
          },

          artworksConnection: getRecentlySoldArtworksConnection(),
        }),
      }),
      resolve: (artist) => {
        const microfunnelData = getArtistMicrofunnelMetadata(
          `/artist/${artist.id}`
        ) // pass in artist href, as thats how CSV data is formatted
        return microfunnelData
      },
    },
  },
})

export const ArtistTargetSupply: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistTargetSupplyType,
  resolve: (artist) => artist,
}
