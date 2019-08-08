import { GraphQLObjectType, GraphQLString } from "graphql"
import {
  ArtworkContextGridType,
  formDefaultGravityArgs,
} from "schema/v2/artwork/artworkContextGrids"
import { artworkConnection } from "schema/v2/artwork"
import { connectionFromArraySlice } from "graphql-relay"
import { pageable } from "relay-cursor-paging"

export const PartnerArtworkGridType = new GraphQLObjectType<
  { partner: any; artwork: any },
  any
>({
  name: "PartnerArtworkGrid",
  interfaces: [ArtworkContextGridType],
  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: ({ partner }) => {
        if (!partner) return null
        return `Other works from ${partner.name}`
      },
    },
    ctaTitle: {
      type: GraphQLString,
      resolve: ({ partner }) => {
        if (!partner) return null
        return `View all works from ${partner.name}`
      },
    },
    ctaHref: {
      type: GraphQLString,
      resolve: ({ partner }) => {
        if (!partner) return null
        return `/${partner.default_profile_id}`
      },
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable(),
      resolve: ({ artwork, partner }, options, { partnerArtworksLoader }) => {
        if (!partner) return null
        const { gravityArgs, offset } = formDefaultGravityArgs({
          options,
          artwork,
        })

        gravityArgs.published = true
        gravityArgs.total_count = true
        gravityArgs.for_sale = true
        gravityArgs.sort = "-published_at"

        return partnerArtworksLoader(partner.id, gravityArgs).then(
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
