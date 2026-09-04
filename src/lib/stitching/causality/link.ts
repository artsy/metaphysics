import { buildHTTPExecutor } from "@graphql-tools/executor-http"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"

import { getResolverContext, withResponseLogging } from "../logLinkMiddleware"
import { headers as requestIDHeaders } from "lib/requestIDs"
import { causalityJwt } from "schema/v2/system/causality_jwt"

const { CAUSALITY_API_BASE } = config

export const createCausalityExecutor = () =>
  withResponseLogging("Causality", async (request) => {
    const ctx = getResolverContext(request)
    const headers: Record<string, string> = {
      ...(ctx && requestIDHeaders(ctx.requestIDs)),
    }
    if (ctx?.meLoader) {
      const { id } = await ctx.meLoader()
      headers.Authorization = `Bearer ${causalityJwt({
        userId: id,
        role: "observer",
        saleId: null,
        bidderId: null,
      })}`
    }
    return buildHTTPExecutor({
      endpoint: urljoin(CAUSALITY_API_BASE, "graphql"),
      fetch: fetch as any,
      headers,
    })(request)
  })
