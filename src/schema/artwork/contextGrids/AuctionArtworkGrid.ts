import { GraphQLObjectType, GraphQLString } from "graphql"
import {
  ContextGridType,
  formDefaultGravityArgs,
} from "schema/artwork/contextGrids"
import { artworkConnection } from "schema/artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { map } from "lodash"

export const AuctionArtworkGridType = new GraphQLObjectType<
  { sale: any; artwork: any },
  any
>({
  name: "AuctionArtworkGrid",
  interfaces: [ContextGridType],
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
    ctaDestination: {
      type: GraphQLString,
      resolve: ({ sale }) => {
        return `/auction/${sale.id}`
      },
    },
    artworks: {
      type: artworkConnection,
      args: pageable(),
      resolve: ({ artwork, sale }, options, { saleArtworksLoader }) => {
        const { eligible_sale_artworks_count, id } = sale
        const { gravityArgs, offset } = formDefaultGravityArgs({
          options,
          artwork,
        })

        return saleArtworksLoader(id, gravityArgs)
          .then(({ body }) => map(body, "artwork"))
          .then(body => {
            return connectionFromArraySlice(body, options, {
              arrayLength: eligible_sale_artworks_count,
              sliceStart: offset,
            })
          })
      },
    },
  }),
})
