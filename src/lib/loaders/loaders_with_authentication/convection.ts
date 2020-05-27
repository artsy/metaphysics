import factories from "../api"
import config from "config"

const { CONVECTION_APP_ID } = config

export default (accessToken, opts) => {
  let convectionTokenLoader
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const {
    gravityLoaderWithAuthenticationFactory,
    convectionLoaderWithAuthenticationFactory,
  } = factories(opts)

  const convectionAccessTokenLoader = () =>
    convectionTokenLoader().then((data) => data.token)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )
  const convectionLoader = convectionLoaderWithAuthenticationFactory(
    convectionAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  convectionTokenLoader = gravityLoader(
    "me/token",
    { client_application_id: CONVECTION_APP_ID },
    { method: "POST" }
  )

  return {
    convectionTokenLoader,
    submissionsLoader: convectionLoader(`submissions`),
    assetCreateLoader: convectionLoader(`assets`, {}, { method: "POST" }),
    submissionCreateLoader: convectionLoader(
      `submissions`,
      {},
      { method: "POST" }
    ),
    submissionUpdateLoader: convectionLoader(
      (id) => `submissions/${id}`,
      {},
      { method: "PUT" }
    ),
  }
}
