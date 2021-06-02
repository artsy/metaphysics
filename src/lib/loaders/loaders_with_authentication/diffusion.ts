import factories from "../api"
import config from "config"
import fetch from "node-fetch"
import { GraphQLError } from "graphql"
import urljoin from "url-join"

const { DIFFUSION_APP_ID } = config
const { DIFFUSION_API_BASE, DIFFUSION_TOKEN } = config

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
  const diffusionTokenLoader = gravityLoader(
    "me/token",
    {
      client_application_id: DIFFUSION_APP_ID,
    },
    { method: "POST" }
  )

  const diffusionGraphqlLoader = async ({
    query,
    variables,
  }: GraphQLArgs): Promise<Record<string, unknown>> => {
    const body = JSON.stringify({
      query,
      variables,
    })

    const response = await fetch(urljoin(DIFFUSION_API_BASE, "graphql"), {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${DIFFUSION_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    const {
      data: diffusionData,
      errors: diffusionErrors,
    } = await response.json()

    // If the diffusion request failed for some reason, throw its errors.
    if (diffusionErrors) {
      const errors = diffusionErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "From diffusion: ")
      throw new GraphQLError(errors)
    } else {
      return diffusionData
    }
  }

  return {
    diffusionTokenLoader,
    diffusionGraphqlLoader,
  }
}
