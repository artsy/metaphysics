import config from "config"
import { GraphQLResolveInfo } from "graphql"
import { computeTotalPages } from "schema/v2/fields/pagination"
import {
  connection,
  EXCHANGE_MAX_PAGE_SIZE,
  orderFromRest,
  RestRecord,
  restFieldsFor,
  selectedRestFields,
} from "./restOrderMapping"

/**
 * Serves stitched Exchange reads from Exchange REST. See restOrderMapping.ts
 * for how orders are mapped and when a query stays on Exchange GraphQL.
 */

type RestContext = {
  meOrdersLoader?: (
    params: Record<string, unknown>
  ) => Promise<{ body: RestRecord[]; headers: Record<string, string> }>
  partnerBuyerActivityLoader?: (key: {
    buyerId: string
    partnerId: string
  }) => Promise<{ total_purchases: number }>
}

// `me/orders` with `details=true`, and `history=true` when selected
const READ_FIELDS = {
  ...restFieldsFor({ details: true, history: true, party: "buyer" }),
  CommerceOrderConnectionWithTotalCount: new Set([
    "__typename",
    "edges",
    "nodes",
    "pageInfo",
    "totalCount",
    "totalPages",
  ]),
  CommerceOrderEdge: new Set(["__typename", "cursor", "node"]),
}

const selectsOrderHistory = (selected: Set<string>) =>
  ["CommerceBuyOrder", "CommerceOfferOrder", "CommerceOrder"].some((type) =>
    selected.has(`${type}.orderHistory`)
  )

type OrderConnectionArgs = {
  after?: string
  before?: string
  first?: number
  last?: number
  participantType?: string
  sellerId?: string
  state?: string
  states?: string[]
}

/**
 * Seller views, cursor pagination, invalid arg combinations and selections of
 * fields REST doesn't map stay on Exchange GraphQL.
 */
export const canServeOrderConnectionFromRest = (
  args: OrderConnectionArgs,
  context: RestContext,
  info?: GraphQLResolveInfo
) =>
  config.EXCHANGE_REST_READS &&
  Boolean(context.meOrdersLoader) &&
  !args.sellerId &&
  args.participantType !== "SELLER" &&
  !args.after &&
  !args.before &&
  !(args.state && args.states) &&
  selectedRestFields(info, READ_FIELDS) !== null

export const orderConnectionFromRest = async ({
  args,
  context,
  conversationId,
  info,
}: {
  args: OrderConnectionArgs
  context: RestContext
  conversationId: string
  info: GraphQLResolveInfo
}) => {
  const { first, last } = args
  const isLast = typeof last === "number" && typeof first !== "number"
  const requested = isLast ? last : first ?? EXCHANGE_MAX_PAGE_SIZE
  const size = Math.max(0, Math.min(requested, EXCHANGE_MAX_PAGE_SIZE))
  const states = args.states ?? (args.state ? [args.state] : undefined)
  const selected = selectedRestFields(info, READ_FIELDS) ?? new Set<string>()

  let response
  try {
    response = await context.meOrdersLoader!({
      // Opt-in order fields: `display_state`, line item
      // `selected_shipping_quote`…
      details: true,
      ...(selectsOrderHistory(selected) ? { history: true } : {}),
      impulse_conversation_id: conversationId,
      page: 1,
      // `last: n` is the first n in the reverse order, reversed back below
      size,
      sort: isLast ? "STATE_UPDATED_AT_ASC" : "STATE_UPDATED_AT_DESC",
      ...(states?.length ? { state: states.join(",") } : {}),
    })
  } catch (error) {
    if (error?.statusCode === 404) return null
    throw error
  }

  const totalCount = parseInt(response.headers?.["x-total-count"] ?? "0", 10)
  const body = (response.body ?? []).filter(Boolean)
  const orders = size === 0 ? [] : isLast ? [...body].reverse() : body
  const hasMore = totalCount > orders.length

  return {
    ...connection(orders.map(orderFromRest), {
      // 1-based position of the first returned order in the full list
      startPosition: isLast ? Math.max(totalCount - orders.length, 0) + 1 : 1,
      hasNextPage: !isLast && hasMore,
      hasPreviousPage: isLast && hasMore,
    }),
    pageCursors: null,
    totalCount,
    totalPages: size > 0 ? computeTotalPages(totalCount, size, null) : 0,
  }
}

export const canServeBuyerActivityFromRest = (
  parent: { partnerId?: string },
  context: RestContext
) =>
  config.EXCHANGE_REST_READS &&
  Boolean(context.partnerBuyerActivityLoader) &&
  Boolean(parent.partnerId)

/**
 * `partnerId` only authorizes the call: the count covers all sellers, like
 * the GraphQL query without `sellerId`.
 */
export const buyerActivityFromRest = async (
  parent: { partnerId: string; userId: string },
  context: RestContext
) => {
  const { total_purchases } = await context.partnerBuyerActivityLoader!({
    buyerId: parent.userId,
    partnerId: parent.partnerId,
  })
  return { totalPurchases: total_purchases }
}
