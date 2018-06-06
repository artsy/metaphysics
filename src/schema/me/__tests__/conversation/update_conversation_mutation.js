/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("UpdateConversationMutation", () => {
  it("sets from_last_viewed_message_id", () => {
    const mutation = `
      mutation {
        updateConversation(input: { conversationId: "25", fromLastViewedMessageId: "35" }) {
          conversation {
            initial_message
          }
        }
      }
    `

    const rootValue = {
      conversationUpdateLoader: () =>
        Promise.resolve({
          initial_message: "Howdy",
          from_email: "percy@cat.com",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(
      updatedConversation => {
        expect(updatedConversation).toMatchSnapshot()
      }
    )
  })
})
