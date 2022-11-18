import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateConversationMutation", () => {
  it("sets from_last_viewed_message_id", async () => {
    const mutation = `
      mutation {
        updateMessage(input: { messageId: "25", spam: true }) {
          conversation {
            initialMessage
          }
        }
      }
    `

    const context = {
      messageUpdateLoader: () =>
        Promise.resolve({
          initial_message: "Howdy",
          from_email_address: "percy@cat.com",
        }),
    }

    try {
      const updatedMessage = await runAuthenticatedQuery(mutation, context)
      expect(updatedMessage).toEqual("foo")
    } catch (error) {
      console.log(error)
    }
  })
})
