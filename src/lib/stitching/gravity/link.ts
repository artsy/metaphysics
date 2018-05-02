import { ApolloLink } from "apollo-link"
import { setContext } from "apollo-link-context"
import { createHttpLink } from "apollo-link-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

const { GRAVITY_GRAPHQL_ENDPOINT } = config

export const createGravityLink = () => {
  const httpLink = createHttpLink({
    fetch,
    uri: urljoin(GRAVITY_GRAPHQL_ENDPOINT, "graphql"),
  })

  const middlewareLink = new ApolloLink(
    (operation, forward) => (forward && operation && forward(operation)) || null
  )

  const authMiddleware = setContext((_request, context) => {
    const locals = context.graphqlContext && context.graphqlContext.res.locals
    const headers = { ...(locals && requestIDHeaders(locals.requestIDs)) }
    Object.assign(headers, { "X-XAPP-TOKEN": config.GRAVITY_XAPP_TOKEN })
    if (locals.accessToken) {
      Object.assign(headers, { "X-ACCESS-TOKEN": locals.accessToken })
    }
    return { headers }
  })

  return middlewareLink.concat(authMiddleware).concat(httpLink)
}
