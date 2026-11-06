import config from "../config"
import { ARTNET_ENVS, ArtnetEnv } from "./artnetEnv"

// TODO: retrieve new access token when it expires
const artnetTokens: Partial<Record<ArtnetEnv, string>> = {}

export async function getAnonymousAccessToken(env: ArtnetEnv): Promise<string> {
  const cached = artnetTokens[env]
  if (cached) {
    return cached
  }
  const token = await requestNewArtnetAccessToken(env)
  artnetTokens[env] = token
  return token
}

async function requestNewArtnetAccessToken(env: ArtnetEnv): Promise<string> {
  const { oidcIssuer, clientIdSuffix } = ARTNET_ENVS[env]
  const clientId = `${config.OIDC_CLIENT_ID}${clientIdSuffix}`
  const clientSecret =
    env === "production"
      ? config.OIDC_CLIENT_SECRET_PRODUCTION
      : config.OIDC_CLIENT_SECRET_NON_PRODUCTION

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  }
  // For local development: these headers are used to access artnet-dev.com
  // from localhost (artnet-dev.com is protected with Cloudflare Access / Zero
  // Trust). Never send them to production.
  if (env !== "production" && config.CF_ACCESS_CLIENT_ID) {
    headers["cf-access-client-id"] = config.CF_ACCESS_CLIENT_ID
    headers["cf-access-client-secret"] = config.CF_ACCESS_CLIENT_SECRET!
  }

  const response = await fetch(`${oidcIssuer}/connect/token`, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret ?? "",
      grant_type: "client_credentials",
    }),
  })
  const data: any = await response.json()

  if (!data.access_token) {
    throw new Error(
      `Failed to get access token for Artnet env "${env}": access_token property missing from response`
    )
  }

  return data.access_token
}
