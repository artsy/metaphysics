import { pageable } from "relay-cursor-paging"
import moment from "moment"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { artworkConnection } from "schema/v2/artwork"
import ArtworkSorts from "schema/v2/sorts/artwork_sorts"
import Image, { normalizeImageData } from "schema/v2/image"
import date from "schema/v2/fields/date"
import {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFieldConfig,
} from "graphql"
import { omit, groupBy, map } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { GlobalIDField, NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"

const FollowedArtistsArtworksGroupType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "FollowedArtistsArtworksGroup",
  interfaces: [NodeInterface],
  fields: () => ({
    id: GlobalIDField,
    href: {
      type: GraphQLString,
      resolve: ({ artistSlug }) => `/artist/${artistSlug}`,
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable({}),
      resolve: ({ artworks }, args) => {
        return connectionFromArraySlice(artworks, args, {
          arrayLength: artworks.length,
          sliceStart: 0,
        })
      },
    },
    artists: {
      type: GraphQLString,
    },
    summary: {
      type: GraphQLString,
    },
    image: {
      type: Image.type,
      resolve: ({ artworks }) => {
        return (
          artworks.length > 0 &&
          artworks[0].artists.length > 0 &&
          normalizeImageData(artworks[0].artists[0])
        )
      },
    },
    publishedAt: date,
  }),
})

const FollowedArtistsArtworksGroup: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionDefinitions({ nodeType: FollowedArtistsArtworksGroupType })
    .connectionType,
  description:
    "A list of published artworks by followed artists (grouped by date and artists).",
  args: pageable({
    sort: ArtworkSorts,
    forSale: { type: GraphQLBoolean },
  }),
  resolve: (
    _root,
    { forSale, ..._options },
    { followedArtistsArtworksLoader }
  ) => {
    const options: any = {
      for_sale: forSale,
      ..._options,
    }
    if (!followedArtistsArtworksLoader) return null

    // Convert Relay-style pagination to the supported page/size style for the backend.
    const gravityOptions = convertConnectionArgsToGravityArgs(options)
    gravityOptions.total_count = true

    return followedArtistsArtworksLoader(omit(gravityOptions, "offset")).then(
      ({ body, headers }) => {
        const connection = connectionFromArraySlice(body, options, {
          arrayLength: parseInt(headers["x-total-count"] || "0", 10),
          sliceStart: gravityOptions.offset,
        })

        const groupedByArtist = groupBy(connection.edges, (item) => {
          // FIXME: Property 'artist' does not exist on type '{}'
          // @ts-ignore
          return item.node.artist.id
        })

        let newEdges = []
        let newEdge
        Object.keys(groupedByArtist).forEach((artist) => {
          const groupedNodes = groupedByArtist[artist]
          /**
           * FIXME: Fix all the type issues commented out with @ts-ignore
           */
          newEdge = {
            node: {
              summary: `${groupedNodes.length} work${
                groupedNodes.length === 1 ? "" : "s"
              } added`,
              artworks: map(groupedNodes, (grouped) => {
                // @ts-ignore
                return grouped.node
              }),
              // @ts-ignore
              id: groupedNodes[0].node._id,
              // @ts-ignore
              artists: groupedNodes[0].node.artist.name,
              // @ts-ignore
              artistSlug: groupedNodes[0].node.artist.id,
              _type: "FollowedArtistsArtworksGroup",
              published_at: moment.max(
                // @ts-ignore
                groupedNodes.map(({ node: { published_at } }) =>
                  moment(published_at)
                )
              ),
            },
            // @ts-ignore
            cursor: groupedNodes[0].cursor,
          }
          newEdges = newEdges.concat(newEdge)
        })

        connection.edges = newEdges
        return connection
      }
    )
  },
}

export default FollowedArtistsArtworksGroup
