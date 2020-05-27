import { GraphQLObjectType, GraphQLString } from "graphql"
import {
  ArtworkContextGridType,
  formDefaultGravityArgs,
} from "schema/v2/artwork/artworkContextGrids"
import { artworkConnection } from "schema/v2/artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { map } from "lodash"

export const AuctionArtworkGridType = new GraphQLObjectType<
  { sale: any; artwork: any },
  any
>({
  name: "AuctionArtworkGrid",
  interfaces: [ArtworkContextGridType],
  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: ({ sale }) => {
        return `Other works from ${sale.name}`
      },
    },
    ctaTitle: {
      type: GraphQLString,
      resolve: () => {
        return "View all works from the auction"
      },
    },
    ctaHref: {
      type: GraphQLString,
      resolve: ({ sale }) => {
        return `/auction/${sale.id}`
      },
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: ({ artwork, sale }, options, { saleArtworksLoader }) => {
        const { eligible_sale_artworks_count, id } = sale
        const { gravityArgs, offset } = formDefaultGravityArgs({
          options,
          artwork,
        })

        return saleArtworksLoader(id, gravityArgs)
          .then(({ body }) => map(body, "artwork"))
          .then((artworks) => {
            return connectionFromArraySlice(artworks, options, {
              arrayLength: eligible_sale_artworks_count,
              sliceStart: offset,
            })
          })
      },
    },
  }),
})
