import urljoin from "url-join"
import fetch from "node-fetch"
import config from "config"
import { GraphQLError } from "graphql"

const { CAUSALITY_API_BASE, CAUSALITY_TOKEN } = config
const uri = urljoin(CAUSALITY_API_BASE, "graphql")

interface GraphQLArgs {
  query: string
  variables: any
}

export const causalityLoaders = (_accessToken, _userID) => {
  const causalityLoader = async ({
    query,
    variables,
  }: GraphQLArgs): Promise<Record<string, unknown>> => {
    const body = JSON.stringify({
      query,
      variables,
    })

    const response = await fetch(uri, {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${CAUSALITY_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    const json = await response.json()
    const { data: causalityData, error, errors: causalityErrors } = json

    if (error) {
      throw new Error(`[loaders/causality.ts]: ${error.message}`)
      // If the causality request failed for some reason, throw its errors.
    } else if (causalityErrors) {
      const errors = causalityErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "From causality service:")

      throw new GraphQLError(`[loaders/causality.ts]: ${errors}`)
    } else {
      return causalityData
    }
  }

  return {
    causalityLoader,
  }
}
