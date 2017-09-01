import { gravityLoaderWithAuthenticationFactory, impulseLoaderWithAuthenticationFactory } from "../api"

const { IMPULSE_APPLICATION_ID } = process.env

export default (accessToken, userID) => {
  let impulseTokenLoader
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const impulseAccessTokenLoader = () => impulseTokenLoader().then(data => data.token)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)
  const impulseLoader = impulseLoaderWithAuthenticationFactory(impulseAccessTokenLoader)

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  impulseTokenLoader = gravityLoader("me/token", { client_application_id: IMPULSE_APPLICATION_ID }, { method: "POST" })

  return {
    // Impulse
    conversationsLoader: impulseLoader("conversations", {
      from_id: userID,
      from_type: "User",
    }),
    conversationLoader: impulseLoader(id => `conversations/${id}`),
    conversationUpdateLoader: impulseLoader(id => `conversations/${id}`, {}, { method: "PUT" }),
    conversationMessagesLoader: impulseLoader("message_details"),
    conversationInvoiceLoader: impulseLoader("invoice_detail"),
    conversationCreateMessageLoader: impulseLoader(
      id => `conversations/${id}/messages`,
      {
        reply_all: true,
        from_id: userID,
      },
      { method: "POST" }
    ),

    // Gravity
    followedArtistLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/artists"),
      "artists",
      "is_followed",
      "artist"
    ),
    followedProfileLoader: trackedEntityLoaderFactory(
      gravityLoader("me/follow/profiles"),
      "profiles",
      "is_followed",
      "profile"
    ),
    savedArtworkLoader: trackedEntityLoaderFactory(
      gravityLoader("collection/saved-artwork/artworks", {
        user_id: userID,
        private: true,
      }),
      "artworks",
      "is_saved"
    ),
  }
}
