import factories from "../api"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"
import { GraphQLError } from "graphql"
import { verbose } from "lib/loggers"

const { EXCHANGE_APP_ID, EXCHANGE_API_BASE } = config
interface GraphQLArgs {
  query: string
  variables: any
}

export default (accessToken, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const { gravityLoaderWithAuthenticationFactory } = factories(opts)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  const exchangeTokenLoader: () => Promise<{ token: string }> = gravityLoader(
    "me/token",
    { client_application_id: EXCHANGE_APP_ID },
    { method: "POST" }
  )

  const exchangeGraphQLLoader = async <R = unknown>({
    query,
    variables,
  }: GraphQLArgs): Promise<Record<string, R>> => {
    const { token } = await exchangeTokenLoader()

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
    verbose(json)

    // If the causality request failed for some reason, throw its errors.
    if (exchangeErrors) {
      const errors = exchangeErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "From exchange: ")
      throw new GraphQLError(errors)
    } else {
      return exchangeData
    }
  }

  return {
    exchangeTokenLoader,
    exchangeGraphQLLoader,
  }
}
