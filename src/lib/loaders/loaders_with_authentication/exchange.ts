import factories from "../api"
import config from "config"

const { EXCHANGE_APP_ID } = config

export const exchangeLoaders = (accessToken, opts) => {
  const {
    gravityLoaderWithAuthenticationFactory,
    exchangeLoaderWithAuthenticationFactory,
  } = factories(opts)

  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  const exchangeTokenLoader: () => Promise<{ token: string }> = gravityLoader(
    "me/token",
    { client_application_id: EXCHANGE_APP_ID },
    { method: "POST" }
  )

  const exchangeAccessTokenLoader = () =>
    exchangeTokenLoader().then(({ token }) => token)

  const exchangeLoader = exchangeLoaderWithAuthenticationFactory(
    exchangeAccessTokenLoader
  )

  const meOrderLoader = exchangeLoader((id) => `me/orders/${id}`)

  const meOrdersLoader = exchangeLoader("me/orders", {}, { headers: true })

  const meOrderUpdateLoader = exchangeLoader(
    (id) => `me/orders/${id}`,
    {},
    {
      method: "PUT",
    }
  )

  const meOrderUpdateShippingAddressLoader = exchangeLoader(
    (id) => `me/orders/${id}/shipping_address`,
    {},
    {
      method: "PUT",
    }
  )

  const meOrderSetFulfillmentOptionLoader = exchangeLoader(
    (id) => `me/orders/${id}/fulfillment_option`,
    {},
    {
      method: "PUT",
    }
  )

  const meOrderUnsetFulfillmentOptionLoader = exchangeLoader(
    (id) => `me/orders/${id}/unset_fulfillment_option`,
    {},
    {
      method: "PUT",
    }
  )

  const meOrderSetPaymentLoader = exchangeLoader(
    (id) => `me/orders/${id}/payment`,
    {},
    {
      method: "PUT",
    }
  )

  const meOrderUnsetPaymentMethodLoader = exchangeLoader(
    (id) => `me/orders/${id}/unset_payment_method`,
    {},
    {
      method: "PUT",
    }
  )

  const meOrderSubmitLoader = exchangeLoader(
    (id) => `me/orders/${id}/submit`,
    {},
    {
      method: "POST",
    }
  )

  const meOfferCreateLoader = exchangeLoader<any, { orderID: string }>(
    ({ orderID }) => `me/orders/${orderID}/offers`,
    {},
    {
      method: "POST",
    }
  )

  const meOfferUpdateLoader = exchangeLoader<
    any,
    { orderID: string; offerID: string }
  >(
    ({ orderID, offerID }) => `me/orders/${orderID}/offers/${offerID}`,
    {},
    {
      method: "PUT",
    }
  )

  const meOfferAcceptLoader = exchangeLoader<
    any,
    { orderID: string; offerID: string }
  >(
    ({ orderID, offerID }) => `me/orders/${orderID}/offers/${offerID}/accept`,
    {},
    {
      method: "POST",
    }
  )

  const meOfferRejectLoader = exchangeLoader<
    any,
    { orderID: string; offerID: string }
  >(
    ({ orderID, offerID }) => `me/orders/${orderID}/offers/${offerID}/reject`,
    {},
    {
      method: "POST",
    }
  )

  const meOfferSubmitLoader = exchangeLoader<
    any,
    { orderID: string; offerID: string }
  >(
    ({ orderID, offerID }) => `me/orders/${orderID}/offers/${offerID}/submit`,
    {},
    {
      method: "POST",
    }
  )

  const meOrderBankAccountBalanceCheckLoader = exchangeLoader(
    (id) => `me/orders/${id}/bank_account_balance_check`
  )

  const stripeConfirmationTokenLoader = exchangeLoader(
    (id) => `stripe_confirmation_tokens/${id}`
  )

  const partnerOrdersLoader = exchangeLoader(
    (partnerId) => `partners/${partnerId}/orders`,
    {},
    { headers: true }
  )

  const partnerOrderLoader = exchangeLoader<
    any,
    { partnerId: string; orderId: string }
  >(({ partnerId, orderId }) => `partners/${partnerId}/orders/${orderId}`)

  return {
    exchangeTokenLoader,
    meOrderBankAccountBalanceCheckLoader,
    meOrderLoader,
    meOrdersLoader,
    meOrderUpdateLoader,
    meOrderUpdateShippingAddressLoader,
    meOrderSetFulfillmentOptionLoader,
    meOrderSetPaymentLoader,
    meOrderSubmitLoader,
    meOrderUnsetFulfillmentOptionLoader,
    meOrderUnsetPaymentMethodLoader,
    meOfferCreateLoader,
    meOfferUpdateLoader,
    meOfferAcceptLoader,
    meOfferRejectLoader,
    meOfferSubmitLoader,
    stripeConfirmationTokenLoader,
    partnerOrdersLoader,
    partnerOrderLoader,
  }
}
