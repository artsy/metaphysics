import _ from "lodash"
import moment from "moment-timezone"
import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLList,
  GraphQLObjectType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import Sale from "../sale"
import { SaleArtworkType } from "../sale_artwork"
import { Lot2 } from "../lot"

export const MyBidsType = new GraphQLObjectType<any, ResolverContext>({
  name: "MyBids",
  fields: () => ({
    isWatching: {
      type: GraphQLBoolean,
    },
    lots: {
      type: new GraphQLList(Lot2),
    },
    sale: {
      type: Sale.type,
    },
    saleArtworks: {
      type: new GraphQLList(SaleArtworkType),
    },
  }),
})

export const MyBids: GraphQLFieldConfig<void, ResolverContext> = {
  type: new GraphQLObjectType({
    name: "MyBids2",
    fields: () => ({
      active: {
        type: new GraphQLList(MyBidsType),
        resolve: ({ active }) => active,
      },
      closed: {
        type: new GraphQLList(MyBidsType),
        resolve: ({ closed }) => closed,
      },
    }),
  }),
  resolve: async (
    _root,
    _args,
    {
      causalityLoader,
      meLoader,
      saleArtworksLoader,
      saleArtworksAllLoader,
      salesLoaderWithHeaders,
      saleLoader,
    }
  ) => {
    if (
      !(
        causalityLoader &&
        meLoader &&
        saleArtworksLoader &&
        saleArtworksAllLoader &&
        salesLoaderWithHeaders &&
        saleLoader
      )
    ) {
      return null
    }

    /**
     * Causality's connection is faux with a max cap of 25, so we'll only ever
     * be able to return a non-pagable single list. Increased to an arbitrarily
     * high number to account for registered sales and watched lots.
     */
    const FETCH_COUNT = 99

    // Grab userID to pass to causality
    const me = await meLoader()

    // Fetch all auction lot standings from a given user
    const causalityPromise = causalityLoader({
      query: gql`
        query LotStandingsConnection($userId: ID!, $first: Int) {
          lotStandingConnection(userId: $userId, first: $first) {
            edges {
              node {
                isHighestBidder
                lot {
                  bidCount
                  internalID
                  reserveStatus
                  saleId
                  soldStatus
                  floorSellingPriceCents
                  sellingPriceCents
                  onlineAskingPriceCents
                }
              }
            }
          }
        }
      `,
      variables: {
        first: FETCH_COUNT,
        userId: me.id,
      },
    })

    // Queue up promise for all registered sales
    const registeredSalesPromise = salesLoaderWithHeaders({
      registered: true,
      is_auction: true,
      size: FETCH_COUNT,
    })

    // Queue up promise for watched lots
    const watchedSaleArtworksPromise = saleArtworksAllLoader({
      include_watched_artworks: true,
      total_count: true,
      first: FETCH_COUNT,
    })

    // Fetch everything in parallel
    const [
      causalityResponse,
      registeredSalesResponse,
      watchedSaleArtworksResponse,
    ] = await Promise.all([
      causalityPromise,
      registeredSalesPromise,
      watchedSaleArtworksPromise,
    ])

    // Map over response to gather all sale IDs
    const causalityLots = (causalityResponse as any).lotStandingConnection.edges.map(
      ({ node }) => node.lot
    )
    const causalitySaleIds = causalityLots.map((lot) => lot.saleId)
    const registeredSaleIds = registeredSalesResponse.body.map(
      (sale) => sale._id
    )
    const watchedSaleIds = watchedSaleArtworksResponse.body.map(
      (artwork) => artwork.sale_id
    )

    // Combine ids from categories and dedupe
    const combinedSaleIds = _.uniq([
      ...causalitySaleIds,
      ...registeredSaleIds,
      ...watchedSaleIds,
    ])

    // Fetch all sales to format into a list
    let combinedSales = await Promise.all(
      combinedSaleIds.map((id) => saleLoader(id))
    )

    // Clean invalid sales
    combinedSales = combinedSales.filter(Boolean)
    // Fetch all sale artworks from sale
    const saleSaleArtworks = await Promise.all(
      combinedSales.map((sale: any) => {
        const lots = causalityLots.filter(
          (causalityLot) => causalityLot.saleId === sale._id
        )
        const artworkIds = lots.map((lot) => lot.internalID)
        return saleArtworksLoader(sale._id, {
          ids: artworkIds,
          offset: 0,
          size: artworkIds.length,
        })
      })
    )

    // Transform data into proper shape for MyBid type
    combinedSales = combinedSales.map((sale: any, index) => {
      // Once sales fetched, search for active lots
      const lots = causalityLots.filter((causalityLot) => {
        return causalityLot.saleId === sale._id
      })

      // If lot isn't in causality it means we're just watching it and there's
      // no bidding activity; return that status.
      if (lots.length === 0) {
        return {
          lots: [],
          sale,
          saleArtworks: watchedSaleArtworksResponse.body,
          isWatching: true,
          ...withSaleInfo(sale),
        }
      }

      // Attach causality lot info to the sale artwork
      saleSaleArtworks[index].body.forEach((saleArtwork, artworkIndex) => {
        saleArtwork.lot = lots[artworkIndex]
      })

      return {
        lots,
        sale,
        saleArtworks: saleSaleArtworks[index].body,
        isWatching: false,
        ...withSaleInfo(sale),
      }
    })

    // Lastly, divide sales by opened / closed and sort by position
    const sorted = sortSales(combinedSales)
    return sorted
  },
}

function sortSales(sales) {
  const [closed, active] = _.partition(sales, (sale) => sale.isClosed)

  // Sort sale by relevant end time (liveStartAt or endAt, depending on type)
  const activeSortedByEnd = _.sortBy(active, (sale) => {
    return moment(sale.endAt).unix()
  })

  // Sort sale artworks by position
  activeSortedByEnd.forEach((sale) => {
    const artworksSortedByPosition = _.sortBy(sale.saleArtworks, "position")
    sale.saleArtworks = artworksSortedByPosition
  })

  return {
    active: activeSortedByEnd,
    closed,
  }
}

function withSaleInfo(sale) {
  const isLiveAuction = Boolean(sale.live_start_at)
  const isClosed = sale.auction_state === "closed"
  const isActive = Boolean(sale.auction_state?.match(/(open|preview)/)?.length)
  const endAt = isLiveAuction ? sale.live_start_at : sale.end_at

  const liveBiddingStarted = () => {
    if (isLiveAuction || isClosed) {
      return false
    }
    const tz = moment.tz.guess(true)
    const now = moment().tz(tz)
    const liveStartMoment = moment(sale.live_start_at).tz(tz)
    const started = now.isAfter(liveStartMoment)
    return started
  }

  return {
    isLiveAuction,
    isClosed,
    isActive,
    endAt,
    liveBiddingStarted,
  }
}
