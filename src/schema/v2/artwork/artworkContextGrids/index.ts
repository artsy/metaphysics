import {
  GraphQLInterfaceType,
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLBoolean,
  GraphQLNonNull,
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
  filter?: string[]
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
  args: {
    includeRelatedArtworks: {
      type: new GraphQLNonNull(GraphQLBoolean),
      defaultValue: true,
      description:
        "Whether to include the `RelatedArtworksGrid` module. Defaults to `true`; preferred behavior is to opt out with `false`.",
    },
  },
  resolve: async (
    artwork,
    args,
    { saleLoader, relatedFairsLoader, showsLoader }
  ) => {
    const { id, artist, partner, sale_ids, show_ids } = artwork
    const { includeRelatedArtworks } = args

    // If the artwork is in an auction, return a context that includes the auction
    if (sale_ids && sale_ids.length > 0) {
      const sale = await saleLoader(sale_ids[0])
      if (sale && sale.is_auction) {
        if (sale.auction_state === "closed") {
          return [
            ...(artist
              ? [{ gridType: "ArtistArtworkGrid", artist, artwork }]
              : []),
            ...(includeRelatedArtworks
              ? [{ gridType: "RelatedArtworkGrid", artist, artwork }]
              : []),
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
    const fair: any = first(fairs)
    if (fair && fair.has_full_feature) {
      const relatedFairShows =
        show_ids && show_ids.length > 0
          ? await showsLoader({
              at_a_fair: true,
              id: show_ids,
              size: 1,
            })
          : []

      // If the artwork is in a fair, return a context that includes that fair show
      if (relatedFairShows && relatedFairShows.length > 0) {
        const fairShow = first(relatedFairShows)
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
            ...(includeRelatedArtworks
              ? [{ gridType: "RelatedArtworkGrid", artwork }]
              : []),
          ]
        }
      }
    }

    const relatedShows =
      show_ids && show_ids.length > 0
        ? await showsLoader({
            at_a_fair: false,
            id: show_ids,
            size: 1,
          })
        : []

    // If the artwork is in a show, return a context that includes that show
    if (relatedShows && relatedShows.length > 0) {
      const show = first(relatedShows)
      return [
        { gridType: "ShowArtworkGrid", show, artwork },
        ...(artist ? [{ gridType: "ArtistArtworkGrid", artist, artwork }] : []),
        ...(partner
          ? [{ gridType: "PartnerArtworkGrid", partner, artwork }]
          : []),
        ...(includeRelatedArtworks
          ? [{ gridType: "RelatedArtworkGrid", artwork }]
          : []),
      ]
    }

    // Fall back to the default context/grids
    return [
      ...(artist ? [{ gridType: "ArtistArtworkGrid", artist, artwork }] : []),
      ...(partner
        ? [{ gridType: "PartnerArtworkGrid", partner, artwork }]
        : []),
      ...(includeRelatedArtworks
        ? [{ gridType: "RelatedArtworkGrid", artwork }]
        : []),
    ]
  },
}
