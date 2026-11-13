import { buildHTTPExecutor } from "@graphql-tools/executor-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"
import gravity from "lib/apis/gravity"

import { getResolverContext, withResponseLogging } from "../logLinkMiddleware"

const { EXCHANGE_API_BASE, EXCHANGE_APP_ID } = config

export const createExchangeExecutor = () =>
  withResponseLogging("Exchange", async (request) => {
    const ctx = getResolverContext(request)
    const headers: Record<string, string> = {
      ...(ctx && requestIDHeaders(ctx.requestIDs)),
    }
    if (ctx) {
      headers["User-Agent"] = ctx.userAgent
        ? ctx.userAgent + "; Metaphysics"
        : "Metaphysics"
    }

    if (ctx?.exchangeTokenLoader) {
      const { token } = await ctx.exchangeTokenLoader()
      headers.Authorization = `Bearer ${token}`
    } else if (ctx?.appToken) {
      const response = await gravity(
        `token/exchange?client_application_id=${EXCHANGE_APP_ID}`,
        null,
        {
          method: "POST",
          appToken: ctx.appToken,
          requestIDs: ctx.requestIDs,
        }
      )
      const { token } = response.body
      headers.Authorization = `Bearer ${token}`
    }

    return buildHTTPExecutor({
      endpoint: urljoin(EXCHANGE_API_BASE, "graphql"),
      fetch: fetch as any,
      headers,
    })(request)
  })
