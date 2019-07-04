import { assign, create, first, flow, compact } from "lodash"
import Fair from "schema/fair"
import Sale from "schema/sale/index"
import PartnerShow from "schema/partner_show"
import { GraphQLUnionType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"
import Show from "schema/show"
import { deprecate } from "lib/deprecation"

export const ArtworkContextFairType = create(Fair.type, {
  name: "ArtworkContextFair",
  isTypeOf: ({ context_type }) => context_type === "Fair",
})

export const ArtworkContextSaleType = create(Sale.type, {
  name: "ArtworkContextSale",
  isTypeOf: ({ context_type }) => context_type === "Sale",
})

export const ArtworkContextAuctionType = create(Sale.type, {
  name: "ArtworkContextAuction",
  isTypeOf: ({ context_type }) => context_type === "Auction",
})

export const ArtworkContextPartnerShowType = create(PartnerShow.type, {
  name: "ArtworkContextPartnerShow",
  isTypeOf: ({ context_type }) => context_type === "PartnerShow",
})

export const ArtworkContextType = new GraphQLUnionType({
  name: "ArtworkContext",
  types: [
    ArtworkContextAuctionType,
    ArtworkContextFairType,
    ArtworkContextPartnerShowType,
    ArtworkContextSaleType,
  ],
})

const choose = flow(
  // @ts-ignore
  compact,
  first
)

const Context: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkContextType,
  description: "Returns the associated Fair/Sale/PartnerShow",
  deprecationReason: deprecate({ inVersion: 2, preferUsageOf: "v2_context" }),
  resolve: (
    { id, sale_ids },
    _options,
    { salesLoader, relatedFairsLoader, relatedShowsLoader }
  ) => {
    let sale_promise
    if (sale_ids && sale_ids.length > 0) {
      sale_promise = salesLoader({ id: sale_ids })
        .then(first)
        .then(sale => {
          if (!sale) return null
          return assign(
            { context_type: sale.is_auction ? "Auction" : "Sale" },
            sale
          )
        })
    }

    const fair_promise = relatedFairsLoader({ artwork: [id], size: 1 })
      .then(first)
      .then(fair => {
        if (!fair || (fair && !fair.has_full_feature)) return null
        return assign({ context_type: "Fair" }, fair)
      })

    const show_promise = relatedShowsLoader({
      artwork: [id],
      size: 1,
      active: false,
      at_a_fair: false,
    })
      .then(({ body }) => body)
      .then(first)
      .then(show => {
        if (!show) return null
        return assign({ context_type: "PartnerShow" }, show)
      })

    return Promise.all([
      sale_promise || Promise.resolve(null),
      fair_promise,
      show_promise,
    ]).then(choose)
  },
}

export default Context

export const ArtworkLocationContextType = new GraphQLUnionType({
  name: "ArtworkLocationContext",
  types: [Fair.type, Sale.type, Show.type],
  resolveType: (value, _context, _info) => {
    switch (value.context_type) {
      case "Fair":
        return Fair.type
      case "PartnerShow":
        return Show.type
      case "Sale":
      case "Auction":
        return Sale.type
      default:
        throw new Error(`Unknown context type: ${value.context_type}`)
    }
  },
})

export const LocationContext: GraphQLFieldConfig<any, ResolverContext> = {
  ...Context,
  deprecationReason: undefined,
  type: ArtworkLocationContextType,
}
