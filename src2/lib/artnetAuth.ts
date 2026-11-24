import config from "../config"

// TODO: retrieve new access token when it expires
let artnetToken: string | null = null

export async function getAnonymousAccessToken(): Promise<string> {
  if (artnetToken) {
    return artnetToken
  }
  artnetToken = await requestNewArtnetAccessToken()
  return artnetToken
}

async function requestNewArtnetAccessToken(): Promise<string> {
  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  }
  // For local development: these headers are used to access artnet-dev.com
  // from localhost (artnet-dev.com is protected with Cloudflare Access / Zero Trust)
  if (config.CF_ACCESS_CLIENT_ID) {
    headers["cf-access-client-id"] = config.CF_ACCESS_CLIENT_ID
    headers["cf-access-client-secret"] = config.CF_ACCESS_CLIENT_SECRET!
  }

  const response = await fetch(`${config.OIDC_ISSUER}/connect/token`, {
    method: "POST",
    headers,
    body: `client_id=${config.OIDC_CLIENT_ID}&client_secret=${config.OIDC_CLIENT_SECRET}&grant_type=client_credentials`,
  })
  const data: any = await response.json()

  if (!data.access_token) {
    throw new Error(
      "Failed to get access token: access_token property missing from response"
    )
  }

  return data.access_token
}
