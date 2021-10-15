import _ from "lodash"
import moment from "moment-timezone"
import { GraphQLFieldConfig, GraphQLList, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import Sale from "../sale"
import { SaleArtworkType } from "../sale_artwork"

import { BodyAndHeaders } from "lib/loaders"

interface LotStandingResponse {
  isHighestBidder: boolean
  lot: {
    // Same as SaleArtwork._id
    internalID: string
    saleId: string
  }
}

interface SaleResponse {
  _id: string
  isClosed: boolean
  endAt: string
}

interface SaleArtworkResponse {
  _id: string
  sale_id: string
  // we attach this manually
  artwork: {
    sale_ids: string[]
  }
}

interface SaleSortingInfo {
  isLiveAuction: boolean
  isClosed: boolean
  isActive: boolean
  endAt: any
  liveBiddingStarted: () => boolean
}

interface SaleArtworkWithPosition extends SaleArtworkResponse {
  isHighestBidder: boolean
  isWatching: boolean
  lotState?: LotStandingResponse["lot"]
}

interface MyBid {
  sale: SaleResponse
  saleArtworks: SaleArtworkWithPosition[]
}

/**
 * A Sale and associated sale artworks, including bidder position and watching status for user
 */
export const MyBidType = new GraphQLObjectType<any, ResolverContext>({
  name: "MyBid",
  fields: () => ({
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
    name: "MyBids",
    fields: () => ({
      active: {
        type: new GraphQLList(MyBidType),
        resolve: ({ active }) => active,
      },
      closed: {
        type: new GraphQLList(MyBidType),
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
  ): Promise<{
    active: Array<MyBid>
    closed: Array<MyBid>
  } | null> => {
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
     * Causality's connection is subject to a max cap of 25, so we'll only ever
     * be able to return a few items. Increased to an arbitrarily
     * high number to account for registered sales and watched lots.
     */
    const FETCH_COUNT = 99

    // Grab userID to pass to causality
    const me: { id: string } = await meLoader()

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
    }) as Promise<{
      lotStandingConnection: { edges: Array<{ node: LotStandingResponse }> }
    }>

    // Queue up promise for all registered sales
    const registeredSalesPromise = salesLoaderWithHeaders({
      registered: true,
      is_auction: true,
      size: FETCH_COUNT,
    }) as Promise<BodyAndHeaders<SaleResponse[]>>

    // Queue up promise for watched lots
    const watchedSaleArtworksPromise = saleArtworksAllLoader({
      include_watched_artworks: true,
      total_count: true,
      first: FETCH_COUNT,
    }) as Promise<BodyAndHeaders<SaleArtworkResponse[]>>

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
    const causalityLotStandings = (
      causalityResponse?.lotStandingConnection?.edges ?? []
    ).map(({ node }) => node)
    const causalitySaleIds = causalityLotStandings.map(
      (node) => node.lot.saleId
    )
    const registeredSaleIds = registeredSalesResponse.body.map(
      (sale) => sale._id
    )
    const watchedSaleIds = watchedSaleArtworksResponse.body.map(
      (saleArtwork) => saleArtwork.artwork.sale_ids[0]
    )

    // Combine ids from categories and dedupe
    const combinedSaleIds = _.uniq([
      ...causalitySaleIds,
      ...registeredSaleIds,
      ...watchedSaleIds,
    ])

    // Fetch all sales to format into a list
    let combinedSales: SaleResponse[] = await Promise.all(
      combinedSaleIds.map((id) => saleLoader(id))
    )

    // Clean invalid sales
    combinedSales = combinedSales.filter(Boolean)

    // Fetch all sale artworks from sale
    const saleSaleArtworks: Array<BodyAndHeaders<
      SaleArtworkResponse[]
    >> = await Promise.all(
      combinedSales.map((sale: any) => {
        const causalityLotsBySaleId = causalityLotStandings.filter(
          (node) => node.lot.saleId === sale._id
        )
        const artworkIds = causalityLotsBySaleId.map(
          (causalityLot) => causalityLot.lot.internalID
        )
        return saleArtworksLoader(sale._id, {
          ids: artworkIds,
          offset: 0,
          size: artworkIds.length,
        })
      })
    )

    // Transform data into proper shape for MyBid type plus SaleInfo (used for sorting)
    const fullyLoadedSales: Array<MyBid & SaleSortingInfo> = combinedSales.map(
      (sale: any, index) => {
        // Once sales fetched, search for active lots
        const lots = causalityLotStandings.filter((node) => {
          return node.lot.saleId === sale._id
        })

        // Check to see if there are any watched lots in the sale
        const watchedLotsFromSale: Omit<
          SaleArtworkWithPosition,
          "isHighestBidder" | "lotState"
        >[] = watchedSaleArtworksResponse.body
          .filter((saleArtwork) => saleArtwork.sale_id === sale._id)
          .map((saleArtwork) => {
            // Attach an isWatching prop to response so that SaleArtwork type
            // can resolve the watching status
            const result = {
              ...saleArtwork,
              isWatching: true,
            }
            return result
          })

        const watchedLotIds = watchedLotsFromSale.map(
          (watchedLot) => watchedLot._id
        )
        const bidUponLots = saleSaleArtworks[index].body

        const allLots: Omit<
          SaleArtworkWithPosition,
          "isHighestBidder" | "lotState"
        >[] = watchedLotsFromSale
          .map((watchedLot) => {
            // Check to see if a user has both watched AND bid on a lot, if so,
            // only take the lot that user bid on and reject the watched one.
            const duplicatedBidOnLot = bidUponLots.find(
              (saleArtwork) => saleArtwork._id === watchedLot._id
            )
            if (duplicatedBidOnLot) {
              return { ...duplicatedBidOnLot, isWatching: true }
            } else {
              return { ...watchedLot, isWatching: true }
            }
          })
          .concat(
            bidUponLots
              .filter((lot) => !watchedLotIds.includes(lot._id))
              .map((lot) => {
                return { ...lot, isWatching: false }
              })
          )

        // Attach lot state to each sale artwork
        const saleArtworksWithPosition: SaleArtworkWithPosition[] = allLots.map(
          (saleArtwork) => {
            const causalityLot = lots.find(
              (lotStanding) => lotStanding.lot.internalID === saleArtwork._id
            )

            // Attach to SaleArtwork.lotState field
            const result = {
              ...saleArtwork,
              lotState: causalityLot?.lot,
              isHighestBidder: Boolean(causalityLot?.isHighestBidder),
            }

            return result
          }
        )

        return {
          sale,
          saleArtworks: saleArtworksWithPosition,
          ...withSaleInfo(sale),
        }
      }
    )

    const sorted = sortSales(fullyLoadedSales)

    return sorted
  },
}

/**
 * Lastly, divide sales by opened / closed, sort by position
 *   and remove watched-only lots from the closed sale response
 */
function sortSales(
  saleBidsInfoAggregate: (MyBid & SaleSortingInfo)[]
): { active: MyBid[]; closed: MyBid[] } {
  // Sort sale by relevant end time (liveStartAt or endAt, depending on type)
  const allSortedByEnd: (MyBid & SaleSortingInfo)[] = _.sortBy(
    saleBidsInfoAggregate,
    (saleInfo) => {
      return moment(saleInfo.endAt).unix()
    }
  )

  // sort each sale's lots by position
  allSortedByEnd.forEach((myBid) => {
    const artworksSortedByPosition: SaleArtworkWithPosition[] = _.sortBy(
      myBid.saleArtworks,
      "position"
    )
    myBid.saleArtworks = artworksSortedByPosition
  })

  const [closed, active] = _.partition(allSortedByEnd, (sale) => sale.isClosed)

  // prune watched lots from closed lots
  closed.forEach((myBid) => {
    const biddedOnlySaleArtworks = myBid.saleArtworks.filter((saleArtwork) =>
      Boolean(saleArtwork.lotState)
    )
    myBid.saleArtworks = biddedOnlySaleArtworks
  })

  return {
    active: active,
    closed: closed,
  }
}

function withSaleInfo(sale): SaleSortingInfo {
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
