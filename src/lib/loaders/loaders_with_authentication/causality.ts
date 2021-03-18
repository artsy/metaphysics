import urljoin from "url-join"
import fetch from "node-fetch"
import config from "config"
import { causalityJwt } from "schema/v2/system/causality_jwt"
import { GraphQLError } from "graphql"

const { CAUSALITY_API_BASE } = config
const uri = urljoin(CAUSALITY_API_BASE, "graphql")

interface GraphQLArgs {
  query: string
  variables: any
}

export const causalityLoaders = (_accessToken, userID) => {
  const causalityLoader = async ({
    query,
    variables,
  }: GraphQLArgs): Promise<Record<string, unknown>> => {
    const token = causalityJwt({
      userId: userID,
      role: "observer",
      saleId: null,
      bidderId: null,
    })

    const body = JSON.stringify({
      query,
      variables,
    })

    const response = await fetch(uri, {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const json = await response.json()
    const { data: causalityData, errors: causalityErrors } = json

    // If the causality request failed for some reason, throw its errors.
    if (causalityErrors) {
      const errors = causalityErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "From causality: ")
      throw new GraphQLError(errors)
    } else {
      return causalityData
    }
  }

  return {
    causalityLoader,
  }
}
