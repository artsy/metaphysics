import {
  GraphQLInterfaceType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLList,
} from "graphql"
import { artworkConnection } from "schema/v2/artwork"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { first } from "lodash"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"

interface GravityArgs {
  exclude_ids?: string[]
  page: number
  size: number
  total_count?: boolean
  sort?: string
  for_sale?: boolean
  published?: boolean
}

export const formDefaultGravityArgs = ({ options, artwork }) => {
  const { page, size, offset } = convertConnectionArgsToGravityArgs(options)
  const gravityArgs: GravityArgs = {
    page,
    size,
    exclude_ids: [artwork._id],
  }

  return {
    gravityArgs,
    offset,
  }
}

const resolveType = (data) => {
  return data.gridType
}

export const ArtworkContextGridType = new GraphQLInterfaceType({
  name: "ArtworkContextGrid",
  description: "A specific grid.",
  fields: () => ({
    title: {
      type: GraphQLString,
    },
    ctaTitle: {
      type: GraphQLString,
    },
    ctaHref: {
      type: GraphQLString,
    },
    artworksConnection: {
      type: artworkConnection.connectionType,
      args: pageable(),
    },
  }),
  resolveType,
})

export const ArtworkContextGrids: GraphQLFieldConfig<any, ResolverContext> = {
  type: new GraphQLList(ArtworkContextGridType),
  resolve: async (
    artwork,
    _options,
    { saleLoader, relatedFairsLoader, relatedShowsLoader }
  ) => {
    const { id, artist, partner, sale_ids } = artwork

    // If the artwork is in an auction, return a context that includes the auction
    if (sale_ids && sale_ids.length > 0) {
      const sale = await saleLoader(sale_ids[0])
      if (sale && sale.is_auction) {
        if (sale.auction_state === "closed") {
          return [
            ...(artist
              ? [{ gridType: "ArtistArtworkGrid", artist, artwork }]
              : []),
            {
              gridType: "RelatedArtworkGrid",
              artist,
              artwork,
            },
          ]
        } else {
          return [
            {
              gridType: "AuctionArtworkGrid",
              sale,
              artwork,
            },
          ]
        }
      }
    }

    const fairs = await relatedFairsLoader({ artwork: [id], size: 1 })
    const fair = first(fairs)
    if (fair && fair.has_full_feature) {
      const relatedFairShowsResponse = await relatedShowsLoader({
        artwork: [id],
        at_a_fair: true,
      })

      // If the artwork is in a fair, return a context that includes that fair show
      if (
        relatedFairShowsResponse &&
        relatedFairShowsResponse.body &&
        relatedFairShowsResponse.body.length > 0
      ) {
        const fairShow = first(relatedFairShowsResponse.body)
        if (fairShow) {
          return [
            {
              gridType: "ShowArtworkGrid",
              show: fairShow,
              atAFair: true,
              artwork,
            },
            ...(artist
              ? [{ gridType: "ArtistArtworkGrid", artist, artwork }]
              : []),
            { gridType: "RelatedArtworkGrid", artwork },
          ]
        }
      }
    }

    const relatedShowsResponse = await relatedShowsLoader({
      artwork: [id],
      size: 1,
      active: false,
      at_a_fair: false,
    })

    // If the artwork is in a show, return a context that includes that show
    if (
      relatedShowsResponse &&
      relatedShowsResponse.body &&
      relatedShowsResponse.body.length > 0
    ) {
      const show = first(relatedShowsResponse.body)
      return [
        { gridType: "ShowArtworkGrid", show, artwork },
        ...(artist ? [{ gridType: "ArtistArtworkGrid", artist, artwork }] : []),
        ...(partner
          ? [{ gridType: "PartnerArtworkGrid", partner, artwork }]
          : []),
        { gridType: "RelatedArtworkGrid", artwork },
      ]
    }

    // Fall back to the default context/grids
    return [
      ...(artist ? [{ gridType: "ArtistArtworkGrid", artist, artwork }] : []),
      ...(partner
        ? [{ gridType: "PartnerArtworkGrid", partner, artwork }]
        : []),
      { gridType: "RelatedArtworkGrid", artwork },
    ]
  },
}
