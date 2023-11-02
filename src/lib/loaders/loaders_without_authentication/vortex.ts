import factories from "../api"
import config from "config"
const { VORTEX_API_BASE } = config
import fetch from "node-fetch"
import urljoin from "url-join"
import { GraphQLError } from "graphql"

interface GraphQLArgs {
  query: string
  variables?: any
}

export default (opts) => {
  const { vortexLoaderWithoutAuthenticationFactory } = factories(opts)

  const vortexGraphqlImpersonationLoader = (opts) => async <T = unknown>({
    query,
  }: GraphQLArgs): Promise<Record<string, T>> => {
    const body = JSON.stringify({
      query,
    })
    const response = await fetch(urljoin(VORTEX_API_BASE, "graphql"), {
      body,
      headers: {
        Authorization: `Bearer ${opts.appToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    const json = await response.json()
    const { error, errors: vortexErrors } = json
    if (error) {
      console.log(error)
      throw new Error(`[loaders/vortex.ts]: ${error}`)
      // If the vortex request failed for some reason, throw its errors.
    } else if (vortexErrors) {
      const errors = vortexErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "From vortex service:")

      throw new GraphQLError(`[loaders/vortex.ts]: ${errors}`)
    } else {
      return json
    }
  }

  const vortexGraphqlLoaderFactory = (appToken) => {
    return ({ query, variables }: GraphQLArgs) => {
      return setup(appToken)(
        "/graphql",
        { query, variables: JSON.stringify(variables) },
        {
          method: "POST",
        }
      )
    }
  }

  return {
    vortexGraphqlLoader: ({ query, variables }: LoaderArgs) => {
      return vortexLoaderWithoutAuthenticationFactory(
        "/graphql",
        { query, variables: JSON.stringify(variables) },
        {
          method: "POST",
        }
      )
    },
  }
}
