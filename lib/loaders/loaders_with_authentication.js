import { gravityLoaderWithAuthentication, impulseLoaderWithAuthentication } from "./apis"
const { IMPULSE_APPLICATION_ID } = process.env

export default (accessToken, userID) => {
  let loaders = null
  const gravityLoader = gravityLoaderWithAuthentication(() => Promise.resolve(accessToken))
  const impulseLoader = impulseLoaderWithAuthentication(() => loaders.impulseTokenLoader().then(data => data.token))

  loaders = {
    impulseTokenLoader: gravityLoader(
      "me/token",
      { method: "POST" },
      { client_application_id: IMPULSE_APPLICATION_ID }
    ),
    conversationsLoader: impulseLoader(
      "conversations",
      {},
      {
        from_id: userID,
        from_type: "User",
      }
    ),
    conversationLoader: impulseLoader(id => `conversations/${id}`),
    conversationMessageDetailsLoader: impulseLoader("message_details"),
  }

  return loaders
}
