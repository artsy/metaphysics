import { assign, first, flow, compact } from "lodash"
import { FairType } from "schema/v2/fair"
import { SaleType } from "schema/v2/sale"
import { ShowType } from "schema/v2/show"
import { GraphQLUnionType, GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const ArtworkContextType = new GraphQLUnionType({
  name: "ArtworkContext",
  types: [FairType, SaleType, ShowType],
  resolveType(value, _context, _info) {
    switch (value.context_type) {
      case "Fair":
        return FairType
      case "Show":
      case "PartnerShow":
        return ShowType
      case "Sale":
      case "Auction":
        return SaleType
      default:
        throw new Error(`Unknown context type: ${value.context_type}`)
    }
  },
})

const choose = flow(
  // @ts-ignore
  compact,
  first
)

const Context: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkContextType,
  description: "Returns the associated Fair/Sale/Show",
  resolve: (
    { id, sale_ids, show_ids },
    _options,
    { salesLoader, relatedFairsLoader, showsLoader }
  ) => {
    let sale_promise
    if (sale_ids && sale_ids.length > 0) {
      sale_promise = salesLoader({ id: sale_ids })
        .then(first)
        .then((sale) => {
          if (!sale) return null
          return assign(
            { context_type: (sale as any).is_auction ? "Auction" : "Sale" },
            sale
          )
        })
    }

    const fair_promise = relatedFairsLoader({ artwork: [id], size: 1 })
      .then(first)
      .then((fair) => {
        if (!fair || (fair && !(fair as any).has_full_feature)) return null
        return assign({ context_type: "Fair" }, fair)
      })

    let showPromise
    if (show_ids && show_ids.length > 0) {
      showPromise = showsLoader({
        at_a_fair: false,
        id: show_ids,
        size: 1,
      })
        .then(first)
        .then((show) => {
          if (!show) return null
          return assign({ context_type: "Show" }, show)
        })
    }

    return Promise.all([
      sale_promise || Promise.resolve(null),
      fair_promise,
      showPromise || Promise.resolve(null),
    ]).then(choose)
  },
}

export default Context
