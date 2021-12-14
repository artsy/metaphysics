import _ from "lodash"
import moment from "moment-timezone"
import { GraphQLFieldConfig, GraphQLList, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import gql from "lib/gql"
import Sale from "../sale"
import { SaleArtworkType } from "../sale_artwork"

import { BodyAndHeaders } from "lib/loaders"

/**
 * Reader take note! To work on this section of the codebase one needs things:
 * - CAUSALITY_TOKEN, set in .env. This can be grabbed via hokusai
 * - `x-user-id` header set in your graphiql client
 */

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
      causalityGraphQLLoader,
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
        causalityGraphQLLoader &&
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
    const causalityPromise = causalityGraphQLLoader({
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

    const causalityLotStandingsBySaleId = _.groupBy(
      causalityLotStandings,
      (lotStanding) => lotStanding.lot.saleId
    )

    const causalitySaleIds = Object.keys(causalityLotStandingsBySaleId)
    const registeredSaleIds = registeredSalesResponse.body.map(
      (sale) => sale._id
    )
    const watchedSaleSlugs = watchedSaleArtworksResponse.body.map(
      (saleArtwork) => saleArtwork.artwork.sale_ids[0]
    )

    // Combine ids from categories and dedupe
    const combinedSaleIds = _.uniq([
      ...causalitySaleIds,
      ...registeredSaleIds,
      ...watchedSaleSlugs,
    ])

    // Fetch all sales to format into a list. Because we are fetching by
    // both id + slug (watchedSaleIds) we must do another uniq.
    // We finally remove invalid & duplicate sales from the results
    const combinedSales: SaleResponse[] = await Promise.all(
      combinedSaleIds.map((id) => saleLoader(id))
    ).then((sales) => {
      return _.uniqBy(sales, (sale) => sale.id).filter(Boolean)
    })

    // Fetch all sale artworks for lot standings
    type SaleArtworksBySaleId = {
      [saleId: string]: SaleArtworkResponse[] | undefined
    }
    const bidUponSaleArtworksBySaleId: SaleArtworksBySaleId = await Promise.all(
      combinedSales.map((sale: any) => {
        const causalityLotStandingsInSale =
          causalityLotStandingsBySaleId[sale._id] || []

        const lotIds = causalityLotStandingsInSale.map(
          (causalityLot) => causalityLot.lot.internalID
        )
        return saleArtworksLoader(sale._id, {
          ids: lotIds,
          offset: 0,
          size: lotIds.length,
        })
      })
    ).then(
      (saleArtworksResponses: Array<BodyAndHeaders<SaleArtworkResponse[]>>) => {
        return saleArtworksResponses.reduce((acc, saleArtworks, index) => {
          const matchingSaleId = combinedSales[index]._id
          return {
            ...acc,
            [matchingSaleId]: saleArtworks.body,
          }
        }, {} as SaleArtworksBySaleId)
      }
    )

    // Transform data into proper shape for MyBid type plus SaleInfo (used for sorting)
    const fullyLoadedSales: Array<MyBid & SaleSortingInfo> = combinedSales.map(
      (sale: any) => {
        const bidUponSaleArtworksWithoutWatchStatus =
          bidUponSaleArtworksBySaleId[sale._id] || ([] as SaleArtworkResponse[])

        // mark lots wit a bid `isWatching: false`
        const bidUponSaleArtworks = bidUponSaleArtworksWithoutWatchStatus.map(
          (sa) => {
            return { ...sa, isWatching: false }
          }
        )
        const bidUponSaleArtworkIds = bidUponSaleArtworks.map(
          (lotStanding) => lotStanding._id
        )

        // mark lots that are watched but not bid on with the `isWatching` prop
        const watchedOnlySaleArtworks = watchedSaleArtworksResponse.body
          .filter((saleArtwork) => {
            const saleSlug = sale.id
            return (
              saleArtwork.sale_id === saleSlug &&
              !bidUponSaleArtworkIds.includes(saleArtwork._id)
            )
          })
          .map((saleArtwork) => {
            return { ...saleArtwork, isWatching: true }
          })

        const allSaleArtworks: Omit<
          SaleArtworkWithPosition,
          "isHighestBidder" | "lotState"
        >[] = watchedOnlySaleArtworks.concat(bidUponSaleArtworks)

        // Find lot standings for sale
        const causalityLotStandingsInSale =
          causalityLotStandingsBySaleId[sale._id] || []

        // Attach lot state to each sale artwork
        const saleArtworksWithPosition: SaleArtworkWithPosition[] = allSaleArtworks.map(
          (saleArtwork) => {
            const causalityLotStanding = causalityLotStandingsInSale.find(
              (lotStanding) => lotStanding.lot.internalID === saleArtwork._id
            )

            // Attach to SaleArtwork.lotState field
            const result = {
              ...saleArtwork,
              lotState: causalityLotStanding?.lot,
              isHighestBidder: Boolean(causalityLotStanding?.isHighestBidder),
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
    active,
    closed,
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
