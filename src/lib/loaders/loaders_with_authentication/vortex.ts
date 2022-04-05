import factories from "../api"
import config from "config"
import { GraphQLError } from "graphql"
import fetch from "node-fetch"
import urljoin from "url-join"

const { VORTEX_APP_ID, VORTEX_API_BASE } = config

interface GraphQLArgs {
  query: string
  variables: any
}

export default (accessToken, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const {
    gravityLoaderWithAuthenticationFactory,
    vortexLoaderWithAuthenticationFactory,
  } = factories(opts)

  const vortexAccessTokenLoader = () =>
    vortexTokenLoader().then((data) => data.token)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  const vortexLoader = vortexLoaderWithAuthenticationFactory(
    vortexAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  const vortexTokenLoader = gravityLoader(
    "me/token",
    { client_application_id: VORTEX_APP_ID },
    { method: "POST" }
  )

  const vortexGraphQLLoader = async <T = unknown>({
    query,
    variables,
  }: GraphQLArgs): Promise<Record<string, T>> => {
    const { token } = await vortexTokenLoader()

    const body = JSON.stringify({ query, variables })

    const response = await fetch(urljoin(VORTEX_API_BASE, "graphql"), {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const json = await response.json()
    const { data: vortexData, error, errors: vortexErrors } = json

    if (error) {
      throw new Error(`[loaders/vortex.ts] ${error.message}`)
    } else if (vortexErrors) {
      const errors = vortexErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "[vortex]: Error ")

      throw new GraphQLError(errors)
    } else {
      return vortexData
    }
  }

  return {
    vortexTokenLoader,
    vortexGraphqlLoaderWithVariables: vortexGraphQLLoader,
    vortexGraphqlLoader: (body) =>
      vortexLoader("/graphql", body, {
        method: "POST",
      }),
  }
}
