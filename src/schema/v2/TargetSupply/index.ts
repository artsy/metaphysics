import { ResolverContext } from "types/graphql"
import {
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLString,
} from "graphql"
import { ArtistType } from "../artist"
import {
  getMicrofunnelData,
  getTargetSupplyArtists,
} from "../artist/targetSupply/utils/getMicrofunnelData"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"
import { artworkConnection } from "schema/v2/artwork"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "../fields/pagination"

//Example query:
// query {
//   targetSupply {
//     microfunnel {
//       metadata {
//         highestRealized
//       }
//       artist {
//         slug
//       }
//       artworks(first: 2) {
// #         realizedPrice
//         pageInfo {
//           hasNextPage
//           endCursor
//         }
//         edges {
//           node {
//             slug
//           }
//         }
//       }
//     }
//   }
// }

const TargetSupplyType = new GraphQLObjectType<any, ResolverContext>({
  name: "TargetSupply",
  fields: {
    microfunnel: {
      type: new GraphQLList(
        new GraphQLObjectType({
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
            // TODO: what can be shared between here and ArtistTargetSupply?
            artworksConnection: {
              args: pageable({
                randomize: {
                  type: GraphQLBoolean,
                  description:
                    "Randomize the order of artworks for display purposes.",
                },
              }),
              type: artworkConnection.connectionType,

              // TODO: figure out how to extend the type inside this connection (artwork)
              //       to include `realizedPrice`.
              // type: new GraphQLList(
              //   new GraphQLObjectType({
              //     name: "TargetSupplyMicrofunnelItemArtwork",
              //     fields: () => {
              //       return {
              //         artwork: {
              //           type: ArtworkType,
              //         },
              //         realizedPrice: {
              //           type: GraphQLString,
              //         },
              //       }
              //     },
              //   })
              // ),
              resolve: async (artist, options, { artworksLoader }) => {
                // TODO: implement `randomize` argument

                const artworkIds = artist.metadata.recentlySoldArtworkIDs
                const { page, size } = convertConnectionArgsToGravityArgs(
                  options
                )
                const body = await artworksLoader({ ids: artworkIds })
                return {
                  totalCount: artworkIds.length,
                  pageCursors: createPageCursors(
                    { page, size },
                    artworkIds.length
                  ),
                  ...connectionFromArray(body, options),
                }

                // const artworkIds = take(
                //   artist.metadata.recentlySoldArtworkIDs,
                //   first
                // )
                // const artworks = await artworksLoader({
                //   ids: artworkIds,
                // })
                // let artworksWithRealizedPrice = artworks.map(
                //   (artwork, index) => {
                //     const realizedPrice = artist.artworks[index].realizedPrice
                //     return {
                //       artwork,
                //       realizedPrice,
                //     }
                //   }
                // )
                // if (randomize) {
                //   artworksWithRealizedPrice = shuffle(artworksWithRealizedPrice)
                // }
                // return artworksWithRealizedPrice
              },
            },
          },
        })
      ),
      resolve: data => {
        const results = data.microfunnel.map(slug => {
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
