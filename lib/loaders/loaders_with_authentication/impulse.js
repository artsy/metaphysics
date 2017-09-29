import moment from "moment"

import { gravityLoaderWithAuthenticationFactory, impulseLoaderWithAuthenticationFactory } from "../api"

const { IMPULSE_APPLICATION_ID } = process.env

/**
 * This optimizes conversations requests by removing requests that are only interested in the `total_count` and instead
 * rely on another request to provide that data.
 */
function optimize(keys) {
  if (keys.length === 1) {
    /**
     * If there’s only 1 request, then it doesn’t matter if it’s a counter or not, we can’t optimize it onto any
     * other request anyways, so just resolve the original key.
     *
     * TODO It could well be that all optimizations will perform this same check, if so just move this into the
     *      loader factory.
     */
    return { keys }
  }
  /**
   * NOTE We only ever query convos of 1 user (the authenticated one) for the duration of 1 query execution, if we
   *      weren’t we’d have to match the counterKeys to the right remainderKeys by user ID and also assume that
   *      multiple counter keys could exist.
   *
   * FIXME We really shouldn’t have to reflect on the key in such a poor way. Maybe we shouldn’t convert the path
   *       and params to a string until the last moment, meaning we could reflect on the query params object here.
   */
  const counterKeyIndex = keys.findIndex(key => key.includes("size=0"))
  const counterKey = keys[counterKeyIndex]
  const remainderKeys = keys.slice(0)
  if (counterKey) remainderKeys.splice(counterKeyIndex, 1)
  return {
    keys: remainderKeys,
    postProcess: responses => {
      const result = responses.slice(0)
      // Now just return any other response at the index where the counter response would have been.
      result.splice(counterKeyIndex, 0, responses[0])
      return result
    },
  }
}

export default (accessToken, userID) => {
  let impulseTokenLoader
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)
  const impulseAccessTokenLoader = () => impulseTokenLoader().then(data => data.token)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(gravityAccessTokenLoader)
  const impulseLoader = impulseLoaderWithAuthenticationFactory(impulseAccessTokenLoader)

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  impulseTokenLoader = gravityLoader("me/token", { client_application_id: IMPULSE_APPLICATION_ID }, { method: "POST" })

  const loaders = {
    conversationsLoader: impulseLoader("conversations", { from_id: userID, from_type: "User" }, {}, optimize),
    conversationsCountLoader: () => loaders.conversationsLoader({ size: 0 }).then(({ total_count }) => total_count),
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
    markMessageReadLoader: impulseLoader(
      "events",
      {
        event: "open",
        timestamp: moment().unix(),
      },
      { method: "POST" }
    ),
  }

  return loaders
}
