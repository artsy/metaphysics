import factories from "../api"
import config from "config"

const { DIFFUSION_APP_ID } = config

export default (accessToken, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const { gravityLoaderWithAuthenticationFactory } = factories(opts)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  const diffusionTokenLoader = gravityLoader(
    "me/token",
    { client_application_id: DIFFUSION_APP_ID },
    { method: "POST" }
  )

  return { diffusionTokenLoader }
}
