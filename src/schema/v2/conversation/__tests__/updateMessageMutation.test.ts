import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateMessageMutation", () => {
  it("marks the message as spam", async () => {
    const mutation = `
      mutation {
        updateMessage(input: { id: "25", spam: true }) {
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

      // TODO
      expect(updatedMessage).toEqual("foo")
    } catch (error) {
      console.log(error)
    }
  })
})
