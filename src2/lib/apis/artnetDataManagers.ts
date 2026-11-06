import config from "config"
import urljoin from "url-join"
import { getAnonymousAccessToken } from "lib/artnetAuth"
import { HTTPError } from "lib/HTTPError"

const { ARTNET_API_BASE } = config

// The shared `fetch` helper builds POST bodies from the query string, which
// turns numbers into strings. Artnet expects a typed JSON body, so this talks
// to `fetch` directly.
export default async function artnetDataManagers(
  path: string,
  { method = "GET", body }: { method?: string; body?: unknown } = {}
): Promise<{ body: any; headers: Headers }> {
  const accessToken = await getAnonymousAccessToken()

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  }
  // For local development: artnet-dev.com is protected with Cloudflare Access
  if (config.CF_ACCESS_CLIENT_ID) {
    headers["cf-access-client-id"] = config.CF_ACCESS_CLIENT_ID
    headers["cf-access-client-secret"] = config.CF_ACCESS_CLIENT_SECRET!
  }

  const url = urljoin(ARTNET_API_BASE, path)
  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(config.REQUEST_TIMEOUT_MS),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new HTTPError(`${url} - ${text}`, response.status, text)
  }

  return {
    body: text ? JSON.parse(text) : undefined,
    headers: response.headers,
  }
}
