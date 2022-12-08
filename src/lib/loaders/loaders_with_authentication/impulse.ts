import factories from "../api"
import config from "config"

const { IMPULSE_APPLICATION_ID } = config

export default (accessToken, _userID, opts) => {
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
    conversationsLoader: impulseLoader("conversations"),
    conversationLoader: impulseLoader((id) => `conversations/${id}`),
    conversationUpdateLoader: impulseLoader(
      (id) => `conversations/${id}`,
      {},
      { method: "PUT" }
    ),
    conversationMessagesLoader: impulseLoader("message_details", {
      include_delivery_pending: true,
    }),
    conversationCreateMessageLoader: impulseLoader(
      (id) => `conversations/${id}/messages`,
      {},
      { method: "POST" }
    ),
    conversationCreateConversationOrderLoader: impulseLoader(
      `conversation_orders`,
      {},
      { method: "POST" }
    ),
    conversationDeleteLoader: impulseLoader(
      (id) => `conversations/${id}`,
      {},
      { method: "DELETE" }
    ),
    messageUpdateLoader: impulseLoader(
      (id) => `messages/${id}`,
      {},
      { method: "PUT" }
    ),
  }
}
