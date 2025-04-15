import factories from "../api"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"
import { GraphQLError } from "graphql"

const { EXCHANGE_APP_ID, EXCHANGE_API_BASE } = config

interface GraphQLArgs {
  query: string
  variables: any
}

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

  const meOrderUpdateLoader = exchangeLoader(
    (id) => `me/orders/${id}`,
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

  const stripeConfirmationTokenLoader = exchangeLoader(
    (id) => `stripe_confirmation_tokens/${id}`
  )

  const exchangeGraphQLLoader = async <R = unknown>({
    query,
    variables,
  }: GraphQLArgs): Promise<Record<string, R>> => {
    const token = await exchangeAccessTokenLoader()

    const body = JSON.stringify({
      query,
      variables,
    })

    const response = await fetch(urljoin(EXCHANGE_API_BASE, "graphql"), {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const json = await response.json()
    const { data: exchangeData, errors: exchangeErrors } = json

    // If the exchange request failed for some reason, throw its errors.
    if (exchangeErrors) {
      const errors = exchangeErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "[exchange]: Error ")
      throw new GraphQLError(errors)
    } else {
      return exchangeData
    }
  }

  return {
    exchangeTokenLoader,
    exchangeGraphQLLoader,
    meOrderLoader,
    meOrderUpdateLoader,
    meOrderSetFulfillmentOptionLoader,
    meOrderSubmitLoader,
    meOrderUnsetFulfillmentOptionLoader,
    meOrderUnsetPaymentMethodLoader,
    stripeConfirmationTokenLoader,
  }
}
