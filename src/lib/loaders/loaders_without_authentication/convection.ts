import factories from "../api"
import config from "config"

const { CONVECTION_APP_ID } = config

export default (opts) => {
  // Send Force XAPP token
  // const convectionTokenLoader = () =>
  //   new Promise((resolve) => {
  //     resolve({ token: opts.appToken })
  //   })

  const {
    gravityLoaderWithoutAuthenticationFactory: gravityLoader,
  } = factories(opts)

  // Get or create a valid token for convection
  const convectionTokenLoader = gravityLoader(
    "/",
    { client_id: CONVECTION_APP_ID },
    { method: "POST" }
  )

  return {
    convectionTokenLoader,
  }
}
