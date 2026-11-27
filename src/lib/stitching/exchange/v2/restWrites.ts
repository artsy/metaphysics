import config from "config"
import { GraphQLResolveInfo } from "graphql"
import { safeJsonParse } from "lib/jsonParse"
import { isNil, omitBy } from "lodash"
import {
  mutationRestFields,
  orderFromRest,
  REQUIRES_ACTION_REST_FIELDS,
  RestProfile,
  RestRecord,
  restFieldsFor,
  selectedRestFields,
} from "./restOrderMapping"

/**
 * Serves stitched Exchange order mutations from Exchange REST, returning the
 * same `orderOrError` union as Exchange GraphQL. A mutation can't be retried
 * on GraphQL once REST has run it, so the selection is checked first: if it
 * selects a field REST doesn't map, the whole mutation goes to GraphQL.
 */

type Loader = (key: any, params?: Record<string, unknown>) => Promise<any>

type RestContext = {
  buyerOfferActionLoader?: Loader
  meOrderCreateLoader?: Loader
  sellerOfferActionLoader?: Loader
  sellerOrderActionLoader?: Loader
}

type Input = Record<string, any>

type RestMutation = {
  call: (input: Input, context: Required<RestContext>) => Promise<RestRecord>
  loader: keyof RestContext
  payloadType: string
  profile: RestProfile
  // The payment can need the buyer's action (SCA): `CommerceOrderRequiresAction`
  requiresAction?: boolean
}

const compact = (params: Record<string, unknown>) => omitBy(params, isNil)

// `POST me/orders` returns the buyer order, without details
const CREATED_ORDER: RestProfile = {
  details: false,
  history: false,
  party: "buyer",
}

// Buyer offer routes always return the buyer order with details and
// `my_last_offer`
const BUYER_ORDER: RestProfile = {
  details: true,
  history: false,
  myLastOffer: true,
  party: "buyer",
}

// Seller routes always return the seller order with details
const SELLER_ORDER: RestProfile = {
  details: true,
  history: false,
  party: "seller",
}

// Same args as each GraphQL mutation passes to `OrderService.create_with_artwork!`
const createOrder = (mode: "buy" | "offer", payloadType: string) => ({
  call: (input: Input, { meOrderCreateLoader }: Required<RestContext>) =>
    meOrderCreateLoader(
      compact({
        artwork_id: input.artworkId,
        edition_set_id: input.editionSetId,
        find_active_or_create:
          mode === "offer" ? input.findActiveOrCreate ?? true : undefined,
        impulse_conversation_id: input.impulseConversationId,
        mode,
        partner_offer_id: input.partnerOfferId,
        quantity: input.quantity ?? 1,
      })
    ),
  loader: "meOrderCreateLoader" as const,
  payloadType,
  profile: CREATED_ORDER,
})

const shippingContact = (input: Input) =>
  input.shippingContact && {
    email: input.shippingContact.email,
    name: input.shippingContact.name,
    phone: input.shippingContact.phone,
  }

const sellerOrderAction = (
  action: string,
  payloadType: string,
  params: (input: Input) => Record<string, unknown> = () => ({})
) => ({
  call: (input: Input, { sellerOrderActionLoader }: Required<RestContext>) =>
    sellerOrderActionLoader(
      { orderId: input.id, action },
      compact(params(input))
    ),
  loader: "sellerOrderActionLoader" as const,
  payloadType,
  profile: SELLER_ORDER,
})

const sellerOfferAction = (
  action: string,
  payloadType: string,
  params: (input: Input) => Record<string, unknown> = () => ({})
) => ({
  call: (input: Input, { sellerOfferActionLoader }: Required<RestContext>) =>
    sellerOfferActionLoader(
      { offerId: input.offerId, action },
      compact(params(input))
    ),
  loader: "sellerOfferActionLoader" as const,
  payloadType,
  profile: SELLER_ORDER,
})

const buyerOfferAction = (
  action: string,
  payloadType: string,
  params: (input: Input) => Record<string, unknown> = () => ({})
) => ({
  call: (input: Input, { buyerOfferActionLoader }: Required<RestContext>) =>
    buyerOfferActionLoader(
      { offerId: input.offerId, action },
      compact(params(input))
    ),
  loader: "buyerOfferActionLoader" as const,
  payloadType,
  profile: BUYER_ORDER,
})

const REST_MUTATIONS: Record<string, RestMutation> = {
  commerceApproveOrder: sellerOrderAction(
    "approve",
    "CommerceApproveOrderPayload",
    (input) => ({ shipping_contact: shippingContact(input) })
  ),
  commerceBuyerAcceptOffer: {
    ...buyerOfferAction("accept", "CommerceBuyerAcceptOfferPayload"),
    requiresAction: true,
  },
  // Creates the buyer's pending counteroffer, submitted with
  // `commerceSubmitPendingOffer`
  commerceBuyerCounterOffer: buyerOfferAction(
    "counter",
    "CommerceBuyerCounterOfferPayload",
    (input) => ({ amount_cents: input.amountCents, note: input.note })
  ),
  commerceBuyerRejectOffer: buyerOfferAction(
    "reject",
    "CommerceBuyerRejectOfferPayload",
    (input) => ({ reject_reason: input.rejectReason?.toLowerCase() })
  ),
  commerceConfirmPickup: sellerOrderAction(
    "confirm_pickup",
    "CommerceConfirmPickupPayload"
  ),
  commerceCreateOfferOrderWithArtwork: createOrder(
    "offer",
    "CommerceCreateOfferOrderWithArtworkPayload"
  ),
  commerceCreateOrderWithArtwork: createOrder(
    "buy",
    "CommerceCreateOrderWithArtworkPayload"
  ),
  // Exchange takes the artwork from the partner offer
  commerceCreatePartnerOfferOrder: createOrder(
    "buy",
    "CommerceCreatePartnerOfferOrderPayload"
  ),
  commerceFulfillAtOnce: sellerOrderAction(
    "fulfill_at_once",
    "CommerceFulfillAtOncePayload",
    ({ fulfillment }) => ({
      fulfillment: compact({
        courier: fulfillment?.courier,
        estimated_delivery: fulfillment?.estimatedDelivery,
        notes: fulfillment?.notes,
        tracking_id: fulfillment?.trackingId,
      }),
    })
  ),
  commerceSellerAcceptOffer: sellerOfferAction(
    "accept",
    "CommerceSellerAcceptOfferPayload",
    (input) => ({ shipping_contact: shippingContact(input) })
  ),
  commerceSellerAcceptProvisionalOffer: sellerOfferAction(
    "accept_provisional",
    "CommerceSellerAcceptProvisionalOfferPayload",
    (input) => ({ shipping_total_cents: input.shippingTotalCents })
  ),
  commerceSellerCounterOffer: sellerOfferAction(
    "counter",
    "CommerceSellerCounterOfferPayload",
    (input) => ({
      amount_cents: input.amountCents,
      note: input.note,
      shipping_contact: shippingContact(input),
      shipping_total_cents: input.shippingTotalCents,
    })
  ),
  commerceSellerRejectOffer: sellerOfferAction(
    "reject",
    "CommerceSellerRejectOfferPayload",
    (input) => ({ reject_reason: input.rejectReason?.toLowerCase() })
  ),
  commerceSubmitPendingOffer: buyerOfferAction(
    "submit",
    "CommerceSubmitPendingOfferPayload"
  ),
  // MP extensions: the Impulse checks and link stay in stitching.ts
  createInquiryOfferOrder: createOrder(
    "offer",
    "CommerceCreateInquiryOfferOrderWithArtworkPayload"
  ),
  createInquiryOrder: createOrder(
    "buy",
    "CommerceCreateInquiryOrderWithArtworkPayload"
  ),
}

export const REST_MUTATION_NAMES = Object.keys(REST_MUTATIONS)

const MUTATION_FIELDS = mutationRestFields(
  Object.values(REST_MUTATIONS).map(({ payloadType }) => payloadType)
)

export const canServeMutationFromRest = (
  fieldName: string,
  context: RestContext,
  info?: GraphQLResolveInfo
) => {
  const mutation = REST_MUTATIONS[fieldName]
  if (!config.EXCHANGE_REST_WRITES || !mutation || !context[mutation.loader]) {
    return false
  }

  const fields = {
    ...restFieldsFor(mutation.profile),
    ...MUTATION_FIELDS,
    ...(mutation.requiresAction ? REQUIRES_ACTION_REST_FIELDS : {}),
  }
  return selectedRestFields(info, fields) !== null
}

const failure = (type: string, code: string, data: unknown) => ({
  __typename: "CommerceOrderWithMutationFailure",
  // Exchange GraphQL sends `data.to_json`, so absent data is "null"
  error: { code, data: JSON.stringify(data ?? null), type },
})

/**
 * - 422 `payment_requires_action` from a route that charges the buyer: the
 *   `CommerceOrderRequiresAction` GraphQL returns, for the client to run SCA
 * - 422: the application error Exchange GraphQL returns as a failure
 * - 404 from an offer or order action: the order or offer isn't the user's,
 *   which GraphQL also returns as a `not_found` failure
 * - anything else throws, like an unexpected GraphQL error
 */
const orderOrErrorFromRestError = (error, mutation: RestMutation) => {
  const body = safeJsonParse<RestRecord>(error?.body) ?? error?.body

  if (
    error?.statusCode === 422 &&
    mutation.requiresAction &&
    body?.code === "payment_requires_action" &&
    body.action_data?.client_secret
  ) {
    return {
      __typename: "CommerceOrderRequiresAction",
      actionData: { clientSecret: body.action_data.client_secret },
    }
  }
  if (error?.statusCode === 422 && body?.code) {
    return failure(body.type ?? "validation", body.code, body.data)
  }
  if (error?.statusCode === 404 && mutation.loader !== "meOrderCreateLoader") {
    return failure("validation", "not_found", null)
  }
  throw error
}

export const mutationFromRest = async (
  fieldName: string,
  input: Input,
  context: RestContext
) => {
  const mutation = REST_MUTATIONS[fieldName]

  let orderOrError
  try {
    const order = await mutation.call(input, context as Required<RestContext>)
    orderOrError = {
      __typename: "CommerceOrderWithMutationSuccess",
      order: orderFromRest(order),
    }
  } catch (error) {
    orderOrError = orderOrErrorFromRestError(error, mutation)
  }

  return { clientMutationId: input.clientMutationId, orderOrError }
}
