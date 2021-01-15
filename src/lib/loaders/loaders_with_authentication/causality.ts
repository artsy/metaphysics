import urljoin from "url-join"
import fetch from "node-fetch"
import config from "config"
import { causalityJwt } from "schema/v2/system/causality_jwt"

const { CAUSALITY_API_BASE } = config
const uri = urljoin(CAUSALITY_API_BASE, "graphql")

interface GraphQLArgs {
  query: string
  variables: any
}

export default (_accessToken, userID) => {
  const causalityLoader = ({
    query,
    variables,
  }: GraphQLArgs): ReturnType<typeof fetch> => {
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

    return fetch(uri, {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
  }

  return {
    causalityLoader,
  }
}
