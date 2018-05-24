import { pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import Artwork from "schema/artwork"
import ArtworkSorts from "schema/sorts/artwork_sorts"
import Image from "schema/image"
import { GraphQLList, GraphQLObjectType, GraphQLString } from "graphql"
import { omit, groupBy, map } from "lodash"
import { parseRelayOptions } from "lib/helpers"
import { GlobalIDField, NodeInterface } from "schema/object_identification"

const FollowedArtistsArtworksGroupType = new GraphQLObjectType({
  name: "FollowedArtistsArtworksGroup",
  interfaces: [NodeInterface],
  fields: () => ({
    __id: GlobalIDField,
    artworks: {
      type: new GraphQLList(Artwork.type),
      description: "List of artworks in this group.",
    },
    artists: {
      type: GraphQLString,
    },
    summary: {
      type: GraphQLString,
    },
    image: {
      type: Image.type,
      resolve: ({ artworks }) => (
          artworks.length > 0 &&
          artworks[0].artists.length > 0 &&
          Image.resolve(artworks[0].artists[0])
        ),
    },
  }),
})

const FollowedArtistsArtworksGroup = {
  type: connectionDefinitions({ nodeType: FollowedArtistsArtworksGroupType })
    .connectionType,
  description:
    "A list of published artworks by followed artists (grouped by date and artists).",
  args: pageable({
    sort: ArtworkSorts,
  }),
  resolve: (
    root,
    options,
    request,
    { rootValue: { followedArtistsArtworksLoader } },
  ) => {
    if (!followedArtistsArtworksLoader) return null

    // Convert Relay-style pagination to the supported page/size style for the backend.
    const gravityOptions = parseRelayOptions(options)
    gravityOptions.total_count = true

    return followedArtistsArtworksLoader(omit(gravityOptions, "offset")).then(({ body, headers }) => {
        const connection = connectionFromArraySlice(body, options, {
          arrayLength: headers["x-total-count"],
          sliceStart: gravityOptions.offset,
        })

        const groupedByArtist = groupBy(connection.edges, item => item.node.artist.id)

        let newEdges = []
        let newEdge
        Object.keys(groupedByArtist).forEach((artist) => {
          const groupedNodes = groupedByArtist[artist]
          newEdge = {
            node: {
              summary: `${groupedNodes.length} Work${
                groupedNodes.length === 1 ? "" : "s"
              } Added`,
              artworks: map(groupedNodes, groupped => groupped.node),
              id: groupedNodes[0].node._id,
              artists: groupedNodes[0].node.artist.name,
              _type: "FollowedArtistsArtworksGroup",
            },
            cursor: groupedNodes[0].cursor,
          }
          newEdges = newEdges.concat(newEdge)
        })

        connection.edges = newEdges
        return connection
      })
  },
}

export default FollowedArtistsArtworksGroup
