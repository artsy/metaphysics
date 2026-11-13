import factories from "../api"
import config from "config"
import gravity from "lib/apis/gravity"

const { IMPULSE_APPLICATION_ID } = config

/**
 * Creates Impulse loaders that use app token swapping (not user authentication).
 * This enables backend applications with xapp tokens to query Impulse data like conversations.
 */
export const impulseLoadersWithAppToken = (opts) => {
  const { appToken } = opts

  // Swap app token for Impulse-scoped app token via Gravity
  // If the app token is not trusted, Gravity will return a 403 error and the loader will throw
  const impulseAppTokenLoader = async () => {
    const response = await gravity(
      `token/exchange?client_application_id=${IMPULSE_APPLICATION_ID}`,
      null,
      {
        method: "POST",
        appToken: appToken,
        requestIDs: opts.requestIDs,
      }
    )
    return response.body.token
  }

  const { impulseLoaderWithAuthenticationFactory } = factories(opts)
  const impulseLoader = impulseLoaderWithAuthenticationFactory(
    impulseAppTokenLoader
  )

  return {
    conversationLoader: impulseLoader((id) => `conversations/${id}`),
  }
}
