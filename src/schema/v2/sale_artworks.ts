import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { map, omit } from "lodash"
import { pageable } from "relay-cursor-paging"

import numeral from "./fields/numeral"
import { ResolverContext } from "types/graphql"
import { SaleArtworkType } from "./sale_artwork"
import {
  SaleArtworksAggregation,
  SaleArtworksAggregationResultsType,
} from "./aggregations/filter_sale_artworks_aggregation"
import { ArtworkType, ArtworkConnectionInterface } from "./artwork"
import { connectionWithCursorInfo } from "./fields/pagination"

const DEFAULTS = {
  aggregations: ["total"],
  first: 10,
}

const SaleArtworkAggregations = {
  description: "Returns aggregation counts for the given filter query.",
  type: new GraphQLList(SaleArtworksAggregationResultsType),
  resolve: ({ aggregations }) => {
    const allowedAggregations = omit(aggregations, [
      "total",
      "followed_artists",
    ])
    return map(allowedAggregations, (counts, slice) => ({
      slice,
      counts,
    }))
  },
}

const SaleArtworkCounts = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "FilterSaleArtworksCounts",
    fields: {
      total: numeral(({ aggregations }) => aggregations.total.value),
      followedArtists: numeral(
        ({ aggregations }) => aggregations.followed_artists.value
      ),
    },
  }),
  resolve: (artist) => artist,
}

export const SaleArtworksConnectionType = connectionWithCursorInfo({
  name: "SaleArtworks",
  nodeType: ArtworkType,
  edgeType: SaleArtworkType,
  connectionFields: {
    aggregations: SaleArtworkAggregations,
    counts: SaleArtworkCounts,
  },
  connectionInterfaces: [ArtworkConnectionInterface],
}).connectionType

export const SaleArtworksConnectionField: GraphQLFieldConfig<
  void,
  ResolverContext
> = {
  args: pageable({
    includeArtworksByFollowedArtists: {
      type: GraphQLBoolean,
      description:
        "When called under the Me field, this defaults to true. Otherwise it defaults to false",
    },
    artistIDs: {
      type: new GraphQLList(GraphQLString),
    },
    aggregations: {
      type: new GraphQLList(SaleArtworksAggregation),
      description:
        "Please make sure to supply the TOTAL aggregation if you will be setting any aggregations",
    },
    liveSale: {
      type: GraphQLBoolean,
    },
    isAuction: {
      type: GraphQLBoolean,
    },
    geneIDs: {
      type: new GraphQLList(GraphQLString),
    },
    estimateRange: {
      type: GraphQLString,
    },
    saleID: {
      type: GraphQLID,
    },
    sort: {
      type: GraphQLString,
    },
    page: {
      type: GraphQLInt,
    },
    size: {
      type: GraphQLInt,
    },
  }),
  description: "Sale Artworks search results",
  type: SaleArtworksConnectionType,
  resolve: async (
    _root,
    {
      artistIDs,
      includeArtworksByFollowedArtists: requestIncludeArtworksByFollowedArtists,
      liveSale,
      isAuction,
      geneIDs,
      estimateRange,
      saleID,
      ..._args
    },
    { saleArtworksFilterLoader, saleArtworksAllLoader },
    info
  ) => {
    /*
    This is kind of weird, so here's what happened. During the v1 -> v2 migration,
    this type was only accessible under `Me` and includeArtworksByFollowedArtists
    was always true. A TODO (see below) was left to clean this up, but before it
    could be cleaned up, the type was already being used elsewhere. We need to keep
    the schema backwards-compatible while also allowing non-`Me` uses to have undefined
    for this argument. So we use this workaround.

    See: https://github.com/artsy/metaphysics/blob/e1c227edc16ac0f38ab28db73c32c26bd8b9d5d7/src/schema/v2/sale_artworks.ts#L74-L77
     */
    let includeArtworksByFollowedArtists = requestIncludeArtworksByFollowedArtists
    if (info.parentType.name === "Me") {
      includeArtworksByFollowedArtists = true
    }

    const args = {
      artist_ids: artistIDs,
      include_artworks_by_followed_artists: includeArtworksByFollowedArtists,
      live_sale: liveSale,
      is_auction: isAuction,
      gene_ids: geneIDs,
      estimate_range: estimateRange,
      sale_id: saleID,
      ..._args,
    }

    const connectionOptions = { ...DEFAULTS, ...args }
    const params = convertConnectionArgsToGravityArgs(connectionOptions)
    let response

    if (saleArtworksAllLoader && args.live_sale) {
      delete params.page
      const { body, headers } = await saleArtworksAllLoader({
        ...params,
        total_count: true,
      })
      response = body

      // Piggyback on existing ES API. TODO: This could perhaps be unified
      // better, but quickfix.
      response = {
        hits: response,
        aggregations: {
          total: {
            value: parseInt(headers["x-total-count"] || "0", 10),
          },
        },
      }
    } else {
      response = await saleArtworksFilterLoader(params)
    }

    const data = {
      ...response,
      ...connectionFromArraySlice(response.hits, connectionOptions, {
        useValueAsEdge: true,
        arrayLength: response.aggregations.total.value,
        sliceStart: params.offset,
      }),
    }

    return data
  },
}
