import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from "graphql"
import { ResolverContext } from "types/graphql"
import { HTTPError } from "lib/HTTPError"
import { safeJsonParse } from "lib/jsonParse"
import { OrderType } from "./types/OrderType"

// Shape of the raw validation-error rejection Exchange returns for
// `me/orders/:id` when the order doesn't exist, e.g.
// { type: "validation", code: "not_found", data: { message: "Couldn't find Order..." } }
const isOrderNotFoundError = (error: any): boolean => {
  const body = safeJsonParse<{ code?: string }>(error?.body) || error?.body

  return body?.code === "not_found"
}

export const MeOrder: GraphQLFieldConfig<void, ResolverContext> = {
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
    },
  },
  type: OrderType,
  resolve: async (_root, { id }, { meOrderLoader }) => {
    if (!meOrderLoader) return null

    try {
      const order = await meOrderLoader(id)

      return order
    } catch (error) {
      if (isOrderNotFoundError(error)) {
        throw new HTTPError("Order Not Found", 404)
      }

      throw error
    }
  },
}
