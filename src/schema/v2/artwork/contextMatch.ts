import { assign } from "lodash"
import {
  GraphQLFieldConfig,
  GraphQLEnumType,
  GraphQLString,
  GraphQLNonNull,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { ArtworkContextType } from "./context"

export const ArtworkContextEnum = new GraphQLEnumType({
  name: "ArtworkContextEnum",
  values: {
    FAIR: { value: "Fair" },
    SHOW: { value: "Show" },
    SALE: { value: "Sale" },
  },
})

export const ContextMatch: GraphQLFieldConfig<any, ResolverContext> = {
  type: ArtworkContextType,
  description: "Returns a specific Fair/Sale/Show context if it exists",
  args: {
    type: {
      type: new GraphQLNonNull(ArtworkContextEnum),
      description: "The type of context to return",
    },
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID of the context to return",
    },
  },
  resolve: async (
    { id: artworkId, sale_ids, show_ids },
    { type, id },
    { salesLoader, relatedFairsLoader, showsLoader }
  ) => {
    switch (type) {
      case "Sale": {
        if (!sale_ids) return null

        const sales = await salesLoader({ id: sale_ids })
        const sale = sales.find((s) => s.id === id)

        if (!sale) return null

        return assign({ context_type: "Sale" }, sale)
      }

      case "Fair": {
        const fairs = await relatedFairsLoader({
          artwork: [artworkId],
          size: 10,
        })

        if (!fairs) return null

        const fair = fairs.find((f) => f.id === id)

        if (!fair) return null

        return assign({ context_type: "Fair" }, fair)
      }

      case "Show": {
        if (!show_ids) return null

        const shows = await showsLoader({
          id: show_ids,
          size: 1,
        })

        if (!shows) return null

        const show = shows.find((s) => s.id === id)

        if (!show) return null

        return assign({ context_type: "Show" }, show)
      }

      default: {
        return null
      }
    }
  },
}
