import factories from "../api"
import config from "config"

const { IMPULSE_APPLICATION_ID } = config

export default (accessToken, userID, opts) => {
  let impulseTokenLoader
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const impulseAccessTokenLoader = () =>
    impulseTokenLoader().then((data) => data.token)

  const {
    gravityLoaderWithAuthenticationFactory,
    impulseLoaderWithAuthenticationFactory,
  } = factories(opts)
  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )
  const impulseLoader = impulseLoaderWithAuthenticationFactory(
    impulseAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  impulseTokenLoader = gravityLoader(
    "me/token",
    { client_application_id: IMPULSE_APPLICATION_ID },
    { method: "POST" }
  )

  return {
    conversationsLoader: impulseLoader("conversations", {
      from_id: userID,
      from_type: "User",
      has_message: true,
    }),
    conversationLoader: impulseLoader((id) => `conversations/${id}`),
    conversationUpdateLoader: impulseLoader(
      (id) => `conversations/${id}`,
      {},
      { method: "PUT" }
    ),
    conversationMessagesLoader: impulseLoader("message_details"),
    conversationInvoiceLoader: impulseLoader("invoice_detail"),
    conversationCreateMessageLoader: impulseLoader(
      (id) => `conversations/${id}/messages`,
      {
        reply_all: true,
        from_id: userID,
      },
      { method: "POST" }
    ),
  }
}
