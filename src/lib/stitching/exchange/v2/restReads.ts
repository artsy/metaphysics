import config from "config"
import {
  getNamedType,
  GraphQLNamedType,
  GraphQLResolveInfo,
  isInterfaceType,
  isObjectType,
  Kind,
  SelectionSetNode,
} from "graphql"
import { date } from "schema/v2/fields/date"
import { computeTotalPages } from "schema/v2/fields/pagination"

/**
 * Serves stitched Exchange reads from Exchange REST, shaped like the
 * `Commerce*` types. Results are plain objects resolved by graphql-js' default
 * resolver, which calls function-valued properties with the field args, so
 * dates are functions and `format`/`timezone` work. A query that selects any
 * field not in `REST_FIELDS` is delegated to Exchange GraphQL instead.
 */

// Exchange GraphQL caps every connection at 20 nodes (`default_max_page_size`).
const EXCHANGE_MAX_PAGE_SIZE = 20

type RestRecord = Record<string, any>

type RestContext = {
  meOrdersLoader?: (
    params: Record<string, unknown>
  ) => Promise<{ body: RestRecord[]; headers: Record<string, string> }>
  partnerBuyerActivityLoader?: (key: {
    buyerId: string
    partnerId: string
  }) => Promise<{ total_purchases: number }>
}

const upcase = (value?: string | null) => value?.toUpperCase()

// Same resolver the stitched DateTime transform uses on the GraphQL path
const rawDateField = date<string | null | undefined>((raw) => raw)
const dateValue = (raw?: string | null) => (args, context, info) =>
  rawDateField.resolve!(raw, args, context, info)

// "credit card" → CREDIT_CARD, "wire_transfer" → WIRE_TRANSFER
const paymentMethodEnum = (value?: string | null) =>
  upcase(value)?.replace(/ /g, "_")

// graphql-ruby's default cursor: urlsafe base64 (no padding) of the 1-based
// position in the full list.
const encodeCursor = (position: number) =>
  Buffer.from(String(position)).toString("base64url")

const connection = <T>(
  nodes: T[],
  { startPosition = 1, hasNextPage = false, hasPreviousPage = false } = {}
) => {
  const edges = nodes.map((node, index) => ({
    cursor: encodeCursor(startPosition + index),
    node,
  }))

  return {
    edges,
    nodes,
    pageInfo: {
      endCursor: edges[edges.length - 1]?.cursor,
      hasNextPage,
      hasPreviousPage,
      startCursor: edges[0]?.cursor,
    },
  }
}

const party = (id?: string, type?: string) => {
  if (!id) return null

  return type === "user"
    ? { __typename: "CommerceUser", id }
    : { __typename: "CommercePartner", id, type }
}

type OffersById = Map<string, RestRecord>

const offerFromRest = (
  offer: RestRecord | null | undefined,
  offersById: OffersById
) => {
  if (!offer) return null

  const from = party(offer.from_id, offer.from_type)
  const fromParticipant = upcase(offer.from_participant)
  let respondsTo

  return {
    amountCents: offer.amount_cents,
    buyerTotalCents: offer.buyer_total_cents,
    createdAt: dateValue(offer.created_at),
    creatorId: offer.creator_id,
    currencyCode: offer.currency_code,
    definesTotal: offer.defines_total,
    from,
    // Read by the `fromDetails` stitching resolver
    fromDetails: from,
    fromParticipant,
    hasDefiniteTotal: offer.has_definite_total,
    id: offer.id,
    internalID: offer.id,
    note: offer.note,
    offerAmountChanged: offer.offer_amount_changed,
    // REST only gives `responds_to_id`; look the offer up among the order's
    // offers. Null if it isn't there, rather than a partial offer that would
    // fail on non-null fields.
    respondsTo: () => {
      const id = offer.responds_to_id
      if (!id || !offersById.has(id)) return null

      if (!respondsTo)
        respondsTo = offerFromRest(offersById.get(id), offersById)
      return respondsTo
    },
    shippingTotalCents: offer.shipping_total_cents,
    submittedAt: dateValue(offer.submitted_at),
    taxTotalCents: offer.tax_total_cents,
  }
}

const shippingQuoteFromRest = (quote?: RestRecord | null) =>
  quote && {
    displayName: quote.display_name,
    id: quote.id,
    isSelected: true,
    priceCents: quote.price_cents,
    tier: quote.tier,
    typeName: quote.type_name,
  }

const lineItemFromRest = (lineItem: RestRecord) => ({
  artworkId: lineItem.artwork_id,
  artworkVersionId: lineItem.artwork_version_id,
  currencyCode: lineItem.currency_code,
  editionSetId: lineItem.edition_set_id,
  id: lineItem.id,
  internalID: lineItem.id,
  listPriceCents: lineItem.list_price_cents,
  partnerOfferId: lineItem.partner_offer_id,
  priceCents: lineItem.list_price_cents,
  quantity: lineItem.quantity,
  selectedShippingQuote: shippingQuoteFromRest(
    lineItem.selected_shipping_quote
  ),
  shippingTotalCents: lineItem.shipping_total_cents,
})

const FULFILLMENT_TYPENAMES = {
  pickup: "CommercePickup",
  ship: "CommerceShip",
  ship_arta: "CommerceShipArta",
}

const requestedFulfillmentFromRest = (order: RestRecord) => {
  const __typename = FULFILLMENT_TYPENAMES[order.fulfillment_type]
  if (!__typename) return null

  if (order.fulfillment_type === "pickup") {
    return {
      __typename,
      fulfillmentType: "pickup",
      phoneNumber: order.buyer_phone_number,
    }
  }

  return {
    __typename,
    addressLine1: order.shipping_address_line1,
    addressLine2: order.shipping_address_line2,
    city: order.shipping_city,
    country: order.shipping_country,
    name: order.shipping_name,
    phoneNumber: order.buyer_phone_number,
    postalCode: order.shipping_postal_code,
    region: order.shipping_region,
  }
}

const eventFromRest = (event: RestRecord, offersById: OffersById) => {
  if (event.type === "offer_submitted") {
    return {
      __typename: "CommerceOfferSubmittedEvent",
      createdAt: dateValue(event.created_at),
      offer: offerFromRest(event.offer, offersById),
    }
  }

  // Exchange GraphQL resolves anything that isn't an offer as a state change
  return {
    __typename: "CommerceOrderStateChangedEvent",
    createdAt: dateValue(event.created_at),
    orderUpdateState: event.order_update_state,
    state: upcase(event.state),
    stateReason: event.state_reason,
  }
}

const orderFromRest = (order: RestRecord) => {
  const mode = upcase(order.mode)
  const orderId = order.id
  // Only present when requested with `history=true`
  const history: RestRecord[] = order.history ?? []
  const offersById: OffersById = new Map()
  ;[
    ...(order.submitted_offers ?? []),
    order.last_submitted_offer,
    ...history.map((event) => event.offer),
  ]
    .filter(Boolean)
    .forEach((offer) => offersById.set(offer.id, offer))

  const buyer = party(order.buyer_id, order.buyer_type)
  const seller = party(order.seller_id, order.seller_type)

  return {
    __typename: mode === "OFFER" ? "CommerceOfferOrder" : "CommerceBuyOrder",
    availablePaymentMethods: (order.available_payment_methods ?? []).map(
      paymentMethodEnum
    ),
    awaitingResponseFrom: upcase(order.awaiting_response_from),
    bankAccountId: order.bank_account_id,
    buyer,
    buyerAction: order.buyer_action,
    // Read by the `buyerDetails` stitching resolver
    buyerDetails: buyer,
    buyerPhoneNumber: order.buyer_phone_number,
    buyerPhoneNumberCountryCode: order.buyer_phone_number_country_code,
    buyerTotalCents: order.buyer_total_cents,
    code: order.code,
    createdAt: dateValue(order.created_at),
    creditCardId: order.credit_card_id,
    creditCardWalletType: order.credit_card_wallet_type,
    currencyCode: order.currency_code,
    // Non-null: fall back to `state` rather than drop the order
    displayState: upcase(order.display_state ?? order.state),
    id: orderId,
    impulseConversationId: order.impulse_conversation_id,
    internalID: orderId,
    itemsTotalCents: order.items_total_cents,
    lastOffer: offerFromRest(order.last_submitted_offer, offersById),
    lineItems: connection((order.line_items ?? []).map(lineItemFromRest)),
    mode,
    orderHistory: history.map((event) => eventFromRest(event, offersById)),
    paymentMethod: paymentMethodEnum(order.payment_method),
    requestedFulfillment: requestedFulfillmentFromRest(order),
    seller,
    // Read by the `sellerDetails` stitching resolver
    sellerDetails: seller,
    shippingRadius: order.shipping_radius,
    shippingTotalCents: order.shipping_total_cents,
    source: order.source,
    state: upcase(order.state),
    stateExpiresAt: dateValue(order.buyer_state_expires_at),
    stateReason: order.state_reason,
    stateUpdatedAt: dateValue(order.state_updated_at),
    stripeConfirmationToken: order.stripe_confirmation_token,
    taxTotalCents: order.tax_total_cents,
    totalListPriceCents: order.total_list_price_cents,
    updatedAt: dateValue(order.updated_at ?? order.state_updated_at),
  }
}

const ORDER_FIELDS = [
  "__typename",
  "availablePaymentMethods",
  "awaitingResponseFrom",
  "bankAccountId",
  "buyer",
  "buyerAction",
  "buyerDetails",
  "buyerPhoneNumber",
  "buyerPhoneNumberCountryCode",
  "buyerProfile",
  "buyerTotal",
  "buyerTotalCents",
  "code",
  "conversation",
  "createdAt",
  "creditCard",
  "creditCardId",
  "creditCardWalletType",
  "currencyCode",
  "displayState",
  "id",
  "impulseConversationId",
  "internalID",
  "isInquiryOrder",
  "itemsTotal",
  "itemsTotalCents",
  "lastOffer",
  "lineItems",
  "mode",
  "orderHistory",
  "paymentMethod",
  "paymentMethodDetails",
  "requestedFulfillment",
  "seller",
  "sellerDetails",
  "shippingRadius",
  "shippingTotal",
  "shippingTotalCents",
  "source",
  "state",
  "stateExpiresAt",
  "stateReason",
  "stateUpdatedAt",
  "stripeConfirmationToken",
  "taxTotal",
  "taxTotalCents",
  "totalListPrice",
  "totalListPriceCents",
  "updatedAt",
]

const SHIPPING_ADDRESS_FIELDS = [
  "__typename",
  "addressLine1",
  "addressLine2",
  "city",
  "country",
  "name",
  "phoneNumber",
  "postalCode",
  "region",
]

const PAGE_INFO_FIELDS = [
  "__typename",
  "endCursor",
  "hasNextPage",
  "hasPreviousPage",
  "startCursor",
]

/**
 * Fields the mappers above set (or that stitching extension resolvers compute
 * from them), per `Commerce*` type. Keep in sync when mapping a new field.
 * Fields returning MP types (`creditCard`, `artwork`…) are resolved by MP from
 * the ids set here, so their selections aren't checked.
 */
const REST_FIELDS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries({
    CommerceBuyOrder: ORDER_FIELDS,
    CommerceLineItem: [
      "__typename",
      "artwork",
      "artworkId",
      "artworkOrEditionSet",
      "artworkVersion",
      "artworkVersionId",
      "editionSetId",
      "id",
      "internalID",
      "listPrice",
      "listPriceCents",
      "partnerOfferId",
      "priceCents",
      "quantity",
      "selectedShippingQuote",
      "shippingTotal",
      "shippingTotalCents",
    ],
    CommerceLineItemConnection: ["__typename", "edges", "nodes", "pageInfo"],
    CommerceLineItemEdge: ["__typename", "cursor", "node"],
    CommerceOffer: [
      "__typename",
      "amount",
      "amountCents",
      "buyerTotal",
      "buyerTotalCents",
      "createdAt",
      "creatorId",
      "currencyCode",
      "definesTotal",
      "from",
      "fromDetails",
      "fromParticipant",
      "hasDefiniteTotal",
      "id",
      "internalID",
      "note",
      "offerAmountChanged",
      "respondsTo",
      "shippingTotal",
      "shippingTotalCents",
      "submittedAt",
      "taxTotal",
      "taxTotalCents",
    ],
    CommerceOfferOrder: ORDER_FIELDS,
    CommerceOfferSubmittedEvent: ["__typename", "createdAt", "offer"],
    CommerceOrder: ORDER_FIELDS,
    CommerceOrderConnectionWithTotalCount: [
      "__typename",
      "edges",
      "nodes",
      "pageInfo",
      "totalCount",
      "totalPages",
    ],
    CommerceOrderEdge: ["__typename", "cursor", "node"],
    CommerceOrderEventUnion: ["__typename"],
    CommerceOrderPartyUnion: ["__typename"],
    CommerceOrderStateChangedEvent: [
      "__typename",
      "createdAt",
      "orderUpdateState",
      "state",
      "stateReason",
    ],
    CommercePageInfo: PAGE_INFO_FIELDS,
    CommercePartner: ["__typename", "id", "type"],
    CommercePickup: ["__typename", "fulfillmentType", "phoneNumber"],
    CommerceRequestedFulfillmentUnion: ["__typename"],
    CommerceShip: SHIPPING_ADDRESS_FIELDS,
    CommerceShipArta: SHIPPING_ADDRESS_FIELDS,
    CommerceShippingQuote: [
      "__typename",
      "displayName",
      "id",
      "isSelected",
      "priceCents",
      "tier",
      "typeName",
    ],
    CommerceUser: ["__typename", "id"],
  }).map(([type, fields]) => [type, new Set(fields)])
)

/**
 * Walks the `orderConnection` selection (including fragments). Returns the
 * selected `Type.field` coordinates, or null when a selected field isn't in
 * `REST_FIELDS`.
 */
const selectedRestFields = (info?: GraphQLResolveInfo) => {
  if (!info?.fieldNodes || !info.schema) return null

  const selected = new Set<string>()

  const walk = (
    selectionSet: SelectionSetNode | undefined,
    type: GraphQLNamedType
  ): boolean =>
    (selectionSet?.selections ?? []).every((selection) => {
      if (selection.kind === Kind.INLINE_FRAGMENT) {
        const fragmentType = selection.typeCondition
          ? info.schema.getType(selection.typeCondition.name.value)
          : type
        return !!fragmentType && walk(selection.selectionSet, fragmentType)
      }

      if (selection.kind === Kind.FRAGMENT_SPREAD) {
        const fragment = info.fragments[selection.name.value]
        const fragmentType =
          fragment && info.schema.getType(fragment.typeCondition.name.value)
        return !!fragmentType && walk(fragment.selectionSet, fragmentType)
      }

      const fieldName = selection.name.value
      if (!REST_FIELDS[type.name]?.has(fieldName)) return false
      selected.add(`${type.name}.${fieldName}`)

      const field =
        (isObjectType(type) || isInterfaceType(type)) &&
        type.getFields()[fieldName]
      if (!field) return true

      // MP types are resolved by MP from the ids set by the mappers
      const fieldType = getNamedType(field.type)
      if (!fieldType.name.startsWith("Commerce")) return true

      return walk(selection.selectionSet, fieldType)
    })

  const rootType = getNamedType(info.returnType)
  const servable = info.fieldNodes.every((node) =>
    walk(node.selectionSet, rootType)
  )
  return servable ? selected : null
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
  selectedRestFields(info) !== null

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
  const selected = selectedRestFields(info) ?? new Set<string>()

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
