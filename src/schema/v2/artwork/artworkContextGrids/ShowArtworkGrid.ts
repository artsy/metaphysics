import { GraphQLObjectType, GraphQLString } from "graphql"
import {
  ArtworkContextGridType,
  formDefaultGravityArgs,
} from "schema/v2/artwork/artworkContextGrids"
import { artworkConnection } from "schema/v2/artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"

export const ShowArtworkGridType = new GraphQLObjectType<
  { show: any; artwork: any; atAFair?: boolean },
  any
>({
  name: "ShowArtworkGrid",
  interfaces: [ArtworkContextGridType],
  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: ({ show }) => {
        return `Other works from ${show.name}`
      },
    },
    ctaTitle: {
      type: GraphQLString,
      resolve: ({ atAFair }) => {
        return atAFair
          ? "View all works from the booth"
          : "View all works from the show"
      },
    },
    ctaHref: {
      type: GraphQLString,
      resolve: ({ show }) => {
        return `/show/${show.id}`
      },
    },
    artworks: {
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: ({ artwork, show }, options, { partnerShowArtworksLoader }) => {
        const loaderOptions = {
          partner_id: show.partner.id,
          show_id: show.id,
        }
        const { gravityArgs, offset } = formDefaultGravityArgs({
          options,
          artwork,
        })

        gravityArgs.total_count = true

        return partnerShowArtworksLoader(loaderOptions, gravityArgs).then(
          ({ body, headers }) => {
            return connectionFromArraySlice(body, options, {
              arrayLength: parseInt(headers["x-total-count"] || "0", 10),
              sliceStart: offset,
            })
          }
        )
      },
    },
  }),
})
