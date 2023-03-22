import urljoin from "url-join"
import fetch from "node-fetch"
import config from "config"
import { GraphQLError } from "graphql"

const { GRAVITY_GRAPHQL_ENDPOINT } = config

export const gravityGraphQL = (accessToken?: string | null) => async ({
  query,
  variables,
}: {
  query: string
  variables?: Record<string, any>
}): Promise<any> => {
  const endpoint = urljoin(GRAVITY_GRAPHQL_ENDPOINT, "graphql")

  const body = JSON.stringify({ query, variables })

  const headers = {
    "Content-Type": "application/json",
    "X-XAPP-TOKEN": config.GRAVITY_XAPP_TOKEN,
    ...(accessToken ? { "X-ACCESS-TOKEN": accessToken } : {}),
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body,
  })

  if (!response.ok) {
    throw new Error(
      `Network error: ${response.status} - ${response.statusText}`
    )
  }

  const res = await response.json()

  if (res.errors) {
    throw new GraphQLError(`GraphQL error: ${JSON.stringify(res.errors)}`)
  }

  return res.data
}
