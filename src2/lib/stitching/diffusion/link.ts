import { buildHTTPExecutor } from "@graphql-tools/executor-http"
import config from "config"
import { headers as requestIDHeaders } from "lib/requestIDs"
import fetch from "node-fetch"
import urljoin from "url-join"

import { getResolverContext, withResponseLogging } from "../logLinkMiddleware"

const { DIFFUSION_API_BASE } = config

export const createDiffusionExecutor = () =>
  withResponseLogging("Diffusion", async (request) => {
    const ctx = getResolverContext(request)
    const headers: Record<string, string> = {
      ...(ctx && requestIDHeaders(ctx.requestIDs)),
    }
    if (ctx?.diffusionTokenLoader) {
      const { token } = await ctx.diffusionTokenLoader()
      headers.Authorization = `Bearer ${token}`
    }
    return buildHTTPExecutor({
      endpoint: urljoin(DIFFUSION_API_BASE, "graphql"),
      fetch: fetch as any,
      headers,
    })(request)
  })
