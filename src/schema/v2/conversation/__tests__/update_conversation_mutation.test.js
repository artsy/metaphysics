/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateConversationMutation", () => {
  it("sets from_last_viewed_message_id", async () => {
    const mutation = `
      mutation {
        updateConversation(input: { conversationId: "25", fromLastViewedMessageId: "35", dismissed: true, sellerOutcome: "already_contacted", sellerOutcomeComment: "Outcome comment" }) {
          conversation {
            initialMessage
          }
        }
      }
    `

    const context = {
      conversationUpdateLoader: () =>
        Promise.resolve({
          initial_message: "Howdy",
          from_email: "percy@cat.com",
        }),
    }

    await runAuthenticatedQuery(mutation, context).then(
      (updatedConversation) => {
        expect(updatedConversation).toEqual({
          updateConversation: { conversation: { initialMessage: "Howdy" } },
        })
      }
    )
    expect.assertions(1)
  })
})
