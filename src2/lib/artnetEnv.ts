export const ARTNET_ENVS = {
  production: {
    apiBase: "https://api.artnet.com/data-services/",
    oidcIssuer: "https://login.artnet.com",
    clientIdSuffix: "",
  },
  staging: {
    apiBase: "https://api.artnet-dev.com/data-services/",
    oidcIssuer: "https://login.artnet-dev.com",
    clientIdSuffix: "",
  },
  qa1: {
    apiBase: "https://qa1-api.artnet-dev.com/data-services/",
    oidcIssuer: "https://qa1-login.artnet-dev.com",
    clientIdSuffix: "-qa1",
  },
  qa2: {
    apiBase: "https://qa2-api.artnet-dev.com/data-services/",
    oidcIssuer: "https://qa2-login.artnet-dev.com",
    clientIdSuffix: "-qa2",
  },
} as const

export type ArtnetEnv = keyof typeof ARTNET_ENVS

const isArtnetEnv = (value: string): value is ArtnetEnv =>
  Object.prototype.hasOwnProperty.call(ARTNET_ENVS, value)

/**
 * Picks the Artnet environment from the `X-Artnet-Env` request header. When the
 * header is missing, the default is production, except for requests to
 * localhost, which default to staging.
 */
export function resolveArtnetEnv({
  artnetEnv,
  host,
}: {
  artnetEnv?: string
  host?: string
}): ArtnetEnv {
  const requested = artnetEnv?.trim().toLowerCase()
  if (requested) {
    if (!isArtnetEnv(requested)) {
      throw new Error(
        `Unknown X-Artnet-Env "${artnetEnv}". Expected one of: ${Object.keys(
          ARTNET_ENVS
        ).join(", ")}`
      )
    }
    return requested
  }

  const hostname = host?.trim().toLowerCase().replace(/:\d+$/, "")
  return hostname === "localhost" ? "staging" : "production"
}
