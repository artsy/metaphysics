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

/**
 * Maps Exchange REST order JSON onto the stitched `Commerce*` types, for the
 * REST-backed reads (restReads.ts) and mutations (restWrites.ts). Results are
 * plain objects resolved by graphql-js' default resolver, which calls
 * function-valued properties with the field args, so dates are functions and
 * `format`/`timezone` work. `REST_FIELDS` lists what the mappers set, and a
 * selection outside it is delegated to Exchange GraphQL.
 */

// Exchange GraphQL caps every connection at 20 nodes (`default_max_page_size`).
export const EXCHANGE_MAX_PAGE_SIZE = 20

export type RestRecord = Record<string, any>

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

export const connection = <T>(
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

type ConnectionArgs = { first?: number; last?: number }

// A connection over a list REST returns in full, paged like Exchange GraphQL
const listConnection = <T>(
  nodes: T[],
  { first, last }: ConnectionArgs = {}
) => {
  const size = Math.min(first ?? last ?? nodes.length, EXCHANGE_MAX_PAGE_SIZE)
  const isLast = typeof last === "number" && typeof first !== "number"
  const page = isLast
    ? nodes.slice(Math.max(nodes.length - size, 0))
    : nodes.slice(0, size)
  const startPosition = isLast ? nodes.length - page.length + 1 : 1

  return connection(page, {
    startPosition,
    hasNextPage: !isLast && nodes.length > page.length,
    hasPreviousPage: isLast && nodes.length > page.length,
  })
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

const shippingQuoteFromRest = (
  quote: RestRecord | null | undefined,
  selectedId?: string
) =>
  quote && {
    displayName: quote.display_name,
    id: quote.id,
    isSelected: quote.id === selectedId,
    priceCents: quote.price_cents,
    tier: quote.tier,
    typeName: quote.type_name,
  }

const fulfillmentFromRest = (fulfillment: RestRecord) => ({
  courier: fulfillment.courier,
  estimatedDelivery: dateValue(fulfillment.estimated_delivery),
  id: fulfillment.id,
  internalID: fulfillment.id,
  trackingId: fulfillment.tracking_id,
})

const shipmentFromRest = (shipment?: RestRecord | null) =>
  shipment && {
    carrierName: shipment.carrier_name,
    contactEmail: shipment.contact_email,
    contactName: shipment.contact_name,
    contactPhone: shipment.contact_phone,
    deliveryEnd: dateValue(shipment.delivery_end),
    deliveryStart: dateValue(shipment.delivery_start),
    estimatedDeliveryWindow: shipment.estimated_delivery_window,
    id: shipment.id,
    labelUrl: shipment.label_url,
    status: shipment.status,
    trackingNumber: shipment.tracking_number,
    trackingUrl: shipment.tracking_url,
  }

const lineItemFromRest = (lineItem: RestRecord) => {
  const selectedQuoteId = lineItem.selected_shipping_quote?.id

  return {
    artworkId: lineItem.artwork_id,
    artworkVersionId: lineItem.artwork_version_id,
    currencyCode: lineItem.currency_code,
    editionSetId: lineItem.edition_set_id,
    fulfillments: (args: ConnectionArgs) =>
      listConnection(
        (lineItem.fulfillments ?? []).map(fulfillmentFromRest),
        args
      ),
    id: lineItem.id,
    internalID: lineItem.id,
    listPriceCents: lineItem.list_price_cents,
    partnerOfferId: lineItem.partner_offer_id,
    priceCents: lineItem.list_price_cents,
    quantity: lineItem.quantity,
    selectedShippingQuote: shippingQuoteFromRest(
      lineItem.selected_shipping_quote,
      selectedQuoteId
    ),
    shipment: shipmentFromRest(lineItem.shipment),
    shippingQuoteOptions: (args: ConnectionArgs) =>
      listConnection(
        (lineItem.shipping_quote_options ?? []).map((quote) =>
          shippingQuoteFromRest(quote, selectedQuoteId)
        ),
        args
      ),
    shippingTotalCents: lineItem.shipping_total_cents,
  }
}

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

type OffersArgs = ConnectionArgs & { fromId?: string; fromType?: string }

/**
 * Maps a buyer or seller order. Fields the presenter leaves out for a party
 * (or without `details`) come out undefined; `REST_FIELDS` keeps queries off
 * them.
 */
export const orderFromRest = (order: RestRecord) => {
  const mode = upcase(order.mode)
  const orderId = order.id
  // Only present when requested with `history=true`
  const history: RestRecord[] = order.history ?? []
  const submittedOffers: RestRecord[] = order.submitted_offers ?? []
  const offersById: OffersById = new Map()
  ;[
    ...submittedOffers,
    order.last_submitted_offer,
    ...history.map((event) => event.offer),
  ]
    .filter(Boolean)
    .forEach((offer) => offersById.set(offer.id, offer))

  const buyer = party(order.buyer_id, order.buyer_type)
  const seller = party(order.seller_id, order.seller_type)

  return {
    __typename: mode === "OFFER" ? "CommerceOfferOrder" : "CommerceBuyOrder",
    artsyCollectsTaxes: order.artsy_collects_taxes,
    artsyRemitsTaxes: order.artsy_remits_taxes,
    artsyTotalCents: order.artsy_total_cents,
    artworkDetails: order.artwork_details,
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
    commissionFeeCents: order.commission_fee_cents,
    conditionsOfSale: order.conditions_of_sale,
    createdAt: dateValue(order.created_at),
    creditCardId: order.credit_card_id,
    creditCardWalletType: order.credit_card_wallet_type,
    currencyCode: order.currency_code,
    displayCommissionRate: order.display_commission_rate,
    // Non-null: fall back to `state` rather than drop the order
    displayState: upcase(order.display_state ?? order.state),
    id: orderId,
    impulseConversationId: order.impulse_conversation_id,
    internalID: orderId,
    itemsTotalCents: order.items_total_cents,
    lastApprovedAt: dateValue(order.last_approved_at),
    lastOffer: offerFromRest(order.last_submitted_offer, offersById),
    lastSubmittedAt: dateValue(order.last_submitted_at),
    lastTransactionFailed: order.last_transaction_failed,
    lastTransactionFailureCode: order.last_transaction_failure_code,
    lineItems: connection((order.line_items ?? []).map(lineItemFromRest)),
    mode,
    // Newest first, like Exchange GraphQL's `offers`
    offers: ({ fromId, fromType, ...args }: OffersArgs = {}) =>
      listConnection(
        submittedOffers
          .filter(
            (offer) =>
              (!fromId || offer.from_id === fromId) &&
              (!fromType || offer.from_type === fromType)
          )
          .sort((a, b) =>
            (b.created_at ?? "").localeCompare(a.created_at ?? "")
          )
          .map((offer) => offerFromRest(offer, offersById)),
        args
      ),
    orderHistory: history.map((event) => eventFromRest(event, offersById)),
    paymentMethod: paymentMethodEnum(order.payment_method),
    paymentSet: order.payment_set,
    requestedFulfillment: requestedFulfillmentFromRest(order),
    seller,
    // Read by the `sellerDetails` stitching resolver
    sellerDetails: seller,
    sellerTotalCents: order.seller_total_cents,
    shippingRadius: order.shipping_radius,
    shippingTotalCents: order.shipping_total_cents,
    source: order.source,
    state: upcase(order.state),
    // Each party gets its own expiry; both are `order.state_expires_at`
    stateExpiresAt: dateValue(
      order.buyer_state_expires_at ?? order.seller_state_expires_at
    ),
    stateReason: order.state_reason,
    stateUpdatedAt: dateValue(order.state_updated_at),
    stripeConfirmationToken: order.stripe_confirmation_token,
    taxTotalCents: order.tax_total_cents,
    taxTypes: (order.tax_types ?? []).map(upcase),
    totalListPriceCents: order.total_list_price_cents,
    transactionFeeCents: order.transaction_fee_cents,
    updatedAt: dateValue(order.updated_at ?? order.state_updated_at),
  }
}

/** What the REST response holds, which decides the fields REST can serve. */
export type RestProfile = {
  details: boolean
  history: boolean
  party: "buyer" | "seller"
}

const ORDER_FIELDS = [
  "__typename",
  "artworkDetails",
  "buyer",
  "buyerDetails",
  "buyerPhoneNumber",
  "buyerPhoneNumberCountryCode",
  "buyerProfile",
  "buyerTotal",
  "buyerTotalCents",
  "code",
  "conditionsOfSale",
  "conversation",
  "createdAt",
  "currencyCode",
  "id",
  "impulseConversationId",
  "internalID",
  "isInquiryOrder",
  "itemsTotal",
  "itemsTotalCents",
  "lastOffer",
  "lineItems",
  "mode",
  "offers",
  "paymentMethod",
  "paymentSet",
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
  "taxTotal",
  "taxTotalCents",
  "totalListPrice",
  "totalListPriceCents",
  "updatedAt",
]

// `awaitingResponseFrom` is buyer-only without details
const BUYER_ORDER_FIELDS = [
  "availablePaymentMethods",
  "awaitingResponseFrom",
  "bankAccountId",
  "buyerAction",
  "creditCard",
  "creditCardId",
  "creditCardWalletType",
  "paymentMethodDetails",
  "stripeConfirmationToken",
]

const SELLER_ORDER_FIELDS = [
  "artsyTotal",
  "artsyTotalCents",
  "commissionFee",
  "commissionFeeCents",
  "displayCommissionRate",
  "sellerTotal",
  "sellerTotalCents",
  "transactionFee",
  "transactionFeeCents",
]

const DETAILS_ORDER_FIELDS = [
  "artsyCollectsTaxes",
  "artsyRemitsTaxes",
  "awaitingResponseFrom",
  "displayState",
  "lastApprovedAt",
  "lastSubmittedAt",
  "lastTransactionFailed",
  "lastTransactionFailureCode",
  "taxTypes",
]

const LINE_ITEM_FIELDS = [
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
  "shippingTotal",
  "shippingTotalCents",
]

const DETAILS_LINE_ITEM_FIELDS = [
  "fulfillments",
  "selectedShippingQuote",
  "shipment",
  "shippingQuoteOptions",
]

const CONNECTION_FIELDS = ["__typename", "edges", "nodes", "pageInfo"]
const EDGE_FIELDS = ["__typename", "cursor", "node"]

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

const COMMON_REST_FIELDS = {
  CommerceFulfillment: [
    "__typename",
    "courier",
    "estimatedDelivery",
    "id",
    "internalID",
    "trackingId",
  ],
  CommerceFulfillmentConnection: CONNECTION_FIELDS,
  CommerceFulfillmentEdge: EDGE_FIELDS,
  CommerceLineItemConnection: CONNECTION_FIELDS,
  CommerceLineItemEdge: EDGE_FIELDS,
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
  CommerceOfferConnection: CONNECTION_FIELDS,
  CommerceOfferEdge: EDGE_FIELDS,
  CommerceOfferSubmittedEvent: ["__typename", "createdAt", "offer"],
  CommerceOrderEventUnion: ["__typename"],
  CommerceOrderPartyUnion: ["__typename"],
  CommerceOrderStateChangedEvent: [
    "__typename",
    "createdAt",
    "orderUpdateState",
    "state",
    "stateReason",
  ],
  CommercePageInfo: [
    "__typename",
    "endCursor",
    "hasNextPage",
    "hasPreviousPage",
    "startCursor",
  ],
  CommercePartner: ["__typename", "id", "type"],
  CommercePickup: ["__typename", "fulfillmentType", "phoneNumber"],
  CommerceRequestedFulfillmentUnion: ["__typename"],
  CommerceShip: SHIPPING_ADDRESS_FIELDS,
  CommerceShipArta: SHIPPING_ADDRESS_FIELDS,
  CommerceShipment: [
    "__typename",
    "carrierName",
    "contactEmail",
    "contactName",
    "contactPhone",
    "deliveryEnd",
    "deliveryStart",
    "estimatedDeliveryWindow",
    "id",
    "labelUrl",
    "status",
    "trackingNumber",
    "trackingUrl",
  ],
  CommerceShippingQuote: [
    "__typename",
    "displayName",
    "id",
    "isSelected",
    "priceCents",
    "tier",
    "typeName",
  ],
  CommerceShippingQuoteConnection: CONNECTION_FIELDS,
  CommerceShippingQuoteEdge: EDGE_FIELDS,
  CommerceUser: ["__typename", "id"],
}

export type RestFields = Record<string, Set<string>>

const toSets = (fields: Record<string, string[]>): RestFields =>
  Object.fromEntries(
    Object.entries(fields).map(([type, names]) => [type, new Set(names)])
  )

/**
 * Fields the mappers above set (or that stitching extension resolvers compute
 * from them), per `Commerce*` type, for a REST response. Keep in sync when
 * mapping a new field. Fields returning MP types (`creditCard`, `artwork`…)
 * are resolved by MP from the ids set here, so their selections aren't
 * checked.
 */
export const restFieldsFor = ({
  details,
  history,
  party,
}: RestProfile): RestFields => {
  const orderFields = [
    ...ORDER_FIELDS,
    ...(party === "buyer" ? BUYER_ORDER_FIELDS : SELLER_ORDER_FIELDS),
    ...(details ? DETAILS_ORDER_FIELDS : []),
    ...(history ? ["orderHistory"] : []),
  ]

  return toSets({
    ...COMMON_REST_FIELDS,
    CommerceBuyOrder: orderFields,
    CommerceLineItem: [
      ...LINE_ITEM_FIELDS,
      ...(details ? DETAILS_LINE_ITEM_FIELDS : []),
    ],
    CommerceOfferOrder: orderFields,
    CommerceOrder: orderFields,
  })
}

/** Mutation results: `orderOrError` around the order. */
export const mutationRestFields = (payloadTypes: string[]): RestFields =>
  toSets({
    ...Object.fromEntries(
      payloadTypes.map((type) => [
        type,
        ["__typename", "clientMutationId", "orderOrError"],
      ])
    ),
    CommerceApplicationError: ["__typename", "code", "data", "type"],
    CommerceOrderOrFailureUnion: ["__typename"],
    CommerceOrderWithMutationFailure: ["__typename", "error"],
    CommerceOrderWithMutationSuccess: ["__typename", "order"],
  })

// Union members REST never returns, so their selections never resolve
const NEVER_RETURNED_TYPES = new Set(["CommerceOrderRequiresAction"])

/**
 * Walks the field's selection (including fragments). Returns the selected
 * `Type.field` coordinates, or null when a selected field isn't in `fields`.
 */
export const selectedRestFields = (
  info: GraphQLResolveInfo | undefined,
  fields: RestFields
) => {
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
        if (fragmentType && NEVER_RETURNED_TYPES.has(fragmentType.name))
          return true
        return !!fragmentType && walk(selection.selectionSet, fragmentType)
      }

      if (selection.kind === Kind.FRAGMENT_SPREAD) {
        const fragment = info.fragments[selection.name.value]
        const fragmentType =
          fragment && info.schema.getType(fragment.typeCondition.name.value)
        if (fragmentType && NEVER_RETURNED_TYPES.has(fragmentType.name))
          return true
        return !!fragmentType && walk(fragment.selectionSet, fragmentType)
      }

      const fieldName = selection.name.value
      if (!fields[type.name]?.has(fieldName)) return false
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
