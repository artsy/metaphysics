import factories from "../api"
import config from "config"

const { VORTEX_APP_ID } = config

export default (accessToken, opts) => {
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const {
    gravityLoaderWithAuthenticationFactory,
    vortexLoaderWithAuthenticationFactory,
  } = factories(opts)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  const vortexTokenLoader = gravityLoader(
    "me/token",
    { client_application_id: VORTEX_APP_ID },
    { method: "POST" }
  )

  const vortexAccessTokenLoader = () =>
    vortexTokenLoader().then((data) => data.token)

  const vortexLoader = vortexLoaderWithAuthenticationFactory(
    vortexAccessTokenLoader
  )

  return {
    vortexTokenLoader,
    vortexGraphqlLoader: (body) =>
      vortexLoader("/graphql", body, {
        method: "POST",
      }),
  }
}
