import { ArtworkType } from "./artwork"
import { GraphQLFieldConfig, GraphQLUnionType } from "graphql"
import { ResolverContext } from "types/graphql"
import { pageable } from "relay-cursor-paging"
import { connectionWithCursorInfo } from "./fields/pagination"
import { ArtistType } from "./artist"
import { fetchHybridConnection } from "./fields/hybridConnection"
import { FetcherForLimitAndOffset } from "./fields/hybridConnection/fetchHybridConnection"

const extractNodeDate = (node) => {
  return Date.parse(node["createdAt"] || node["created_at"])
}

const fetchArtworksForPagination = (
  artworksLoader: any
): FetcherForLimitAndOffset<any> => async ({ limit, offset, sort }) => {
  const page = limit ? Math.round((limit + offset) / limit) : 1
  const { body, headers } = await artworksLoader({
    page,
    size: limit,
    sort: sort == "ASC" ? "created_at" : "-created_at", // double check this is the right place for this arg
    total_count: true,
  })
  const totalCount = parseInt(headers["x-total-count"] || "0", 10)
  const artworks = body.map((artwork) => {
    return {
      ...artwork,
      context_type: "Artwork",
    }
  })
  console.log({ artworksLength: artworks.length, totalCount })
  return {
    totalCount,
    nodes: artworks,
  }
}

const fetchArtistsForPagination = (
  artistsLoader: any
): FetcherForLimitAndOffset<any> => async ({ limit, offset, sort }) => {
  const page = limit ? Math.round((limit + offset) / limit) : 1
  const { body, headers } = await artistsLoader({
    page,
    size: limit,
    sort: sort == "ASC" ? "sortable_id" : "-sortable_id",
    total_count: true,
  })
  const totalCount = parseInt(headers["x-total-count"] || "0", 10)
  const artists = body.map((artist) => {
    return {
      ...artist,
      context_type: "Artist",
    }
  })
  console.log({ artistsLength: artists.length, totalCount })
  return {
    totalCount,
    nodes: artists,
  }
}

export const ArtworksAndArtistsUnion = new GraphQLUnionType({
  name: "ArtworkOrArtist",
  types: [ArtworkType, ArtistType],
  resolveType: (value, ..._args) => {
    switch (value.context_type) {
      case "Artist":
        return ArtistType
      case "Artwork":
        return ArtworkType
      default:
        throw new Error(`Unknown context type: ${value.context_type}`)
    }
  },
})

export const artworksAndArtistsConnection: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  type: connectionWithCursorInfo({
    nodeType: ArtworksAndArtistsUnion,
  }).connectionType,
  description: "A list of Artworks and Artists",
  args: pageable({}),
  resolve: async (_root, args, { artworksLoader, artistsLoader }) => {
    const result = await fetchHybridConnection({
      args,
      fetchers: {
        artworks: fetchArtworksForPagination(artworksLoader),
        artists: fetchArtistsForPagination(artistsLoader),
        // artists: fetchArtistsForPagination,
      },
      transform: (args, nodes) => {
        // Sort the nodes before returning the relevant slice
        const sorter =
          args.sort === "DESC"
            ? (a, b) => extractNodeDate(b) - extractNodeDate(a)
            : (a, b) => extractNodeDate(a) - extractNodeDate(b)

        const sortedNodes = nodes.sort(sorter)
        return sortedNodes
      },
    })
    return result
  },
}
