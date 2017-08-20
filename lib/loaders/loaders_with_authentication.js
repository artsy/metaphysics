import { gravityLoaderWithAuthenticationFactory, impulseLoaderWithAuthenticationFactory } from "./api"
const { IMPULSE_APPLICATION_ID } = process.env

export default (accessToken, userID) => {
  let impulseTokenLoader
  const gravityLoader = gravityLoaderWithAuthenticationFactory(() => Promise.resolve(accessToken))
  const impulseLoader = impulseLoaderWithAuthenticationFactory(() => impulseTokenLoader().then(data => data.token))

  impulseTokenLoader = gravityLoader("me/token", { client_application_id: IMPULSE_APPLICATION_ID }, { method: "POST" })

  return {
    impulseTokenLoader,
    conversationsLoader: impulseLoader("conversations", {
      from_id: userID,
      from_type: "User",
    }),
    conversationLoader: impulseLoader(id => `conversations/${id}`),
    conversationUpdateLoader: impulseLoader(id => `conversations/${id}`, {}, { method: "PUT" }),
    conversationMessagesLoader: impulseLoader("message_details"),
    conversationCreateMessageLoader: impulseLoader(
      id => `conversations/${id}/messages`,
      {
        reply_all: true,
        from_id: userID,
      },
      { method: "POST" }
    ),
  }
}
