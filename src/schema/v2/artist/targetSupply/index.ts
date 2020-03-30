import { ResolverContext } from "types/graphql"
import { getMicrofunnelData } from "./utils/getMicrofunnelData"
import { shuffle } from "lodash"

import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ArtworkType } from "schema/v2/artwork"

const ArtistTargetSupplyType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistTargetSupply",
  fields: {
    isInMicrofunnel: {
      description:
        "Returns whether an artist is in within the microfunnel list.",
      type: GraphQLBoolean,
      resolve: artist => Boolean(getMicrofunnelData(`/artist/${artist.id}`)),
    },

    microfunnel: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ArtistTargetSupplyMicrofunnel",
        fields: {
          /**
           * This field is resolved by parsing static CSVtoJSON data.
           * @see src/schema/v2/artist/targetSupply/utils/getMicrofunnelData.ts
           */
          metadata: {
            type: new GraphQLObjectType<any, ResolverContext>({
              name: "ArtistTargetSupplyMicrofunnelMetadata",
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
          /**
           * Take all of the recentlySoldArtworkIDs from metadata and perform
           * a fetch for associated artworks and attach recently sold prices.
           */
          artworks: {
            args: {
              randomize: {
                type: GraphQLBoolean,
                description:
                  "Randomize the order of artworks for display purposes.",
              },
            },
            type: new GraphQLList(
              new GraphQLObjectType({
                name: "ArtistTargetSupplyMicrofunnelArtwork",
                fields: () => {
                  return {
                    artwork: {
                      type: ArtworkType,
                    },
                    realizedPrice: {
                      type: GraphQLString,
                    },
                  }
                },
              })
            ),
            resolve: async (
              artist,
              { randomize = false },
              { artworksLoader }
            ) => {
              const artworks = await artworksLoader({
                ids: artist.metadata.recentlySoldArtworkIDs,
              })
              let artworksWithRealizedPrice = artworks.map((artwork, index) => {
                const realizedPrice = artist.artworks[index].realizedPrice
                return {
                  artwork,
                  realizedPrice,
                }
              })
              if (randomize) {
                artworksWithRealizedPrice = shuffle(artworksWithRealizedPrice)
              }
              return artworksWithRealizedPrice
            },
          },
        },
      }),
      resolve: artist => {
        const microfunnelData = getMicrofunnelData(`/artist/${artist.id}`) // pass in artist href, as thats how CSV data is formatted
        return microfunnelData
      },
    },
  },
})

export const ArtistTargetSupply: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistTargetSupplyType,
  resolve: artist => artist,
}
