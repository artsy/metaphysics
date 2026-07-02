import { buildHTTPExecutor } from "@graphql-tools/executor-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

import { getResolverContext, withResponseLogging } from "../logLinkMiddleware"
import { headers as requestIDHeaders } from "lib/requestIDs"
import { tokenIfPropagatable } from "lib/apis/vortex"

const { VORTEX_API_BASE, VORTEX_TOKEN } = config

export const createVortexExecutor = () =>
  withResponseLogging("Vortex", async (request) => {
    const ctx = getResolverContext(request)
    const headers: Record<string, string> = {
      ...(ctx && requestIDHeaders(ctx.requestIDs)),
    }

    if (ctx?.vortexTokenLoader && !tokenIfPropagatable(ctx.appToken)) {
      const { token } = await ctx.vortexTokenLoader()
      headers.Authorization = `Bearer ${token}`
    } else {
      const token = tokenIfPropagatable(ctx?.appToken) || VORTEX_TOKEN
      headers.Authorization = `Bearer ${token}`
    }

    return buildHTTPExecutor({
      endpoint: urljoin(VORTEX_API_BASE, "graphql"),
      fetch: fetch as any,
      headers,
    })(request)
  })
