/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("SendConversationMessageMutation", () => {
  it("creates a message and returns its new data payload", () => {
    const mutation = `
      mutation {
        sendConversationMessage(
          input: {
            id: "623",
            from: "pio-dog@example.com",
            body_text: "Sehr schön!"
            reply_to_message_id: "221"
          }
        ) {
            conversation {
              id
            }
            messageEdge {
              cursor
              node {
                id
                body
                from {
                  email
                  name
                }
              }
            }
          }
      }
    `

    const rootValue = {
      conversationLoader: () =>
        Promise.resolve({
          id: "420",
          initial_message: "10/10 would buy",
          from_email: "gallery@example.com",
          to: ["1234567"],
          to_name: "Some Gallery",
        }),
      conversationCreateMessageLoader: () =>
        Promise.resolve({
          id: "222",
          radiation_message_id: "333",
        }),
    }

    expect.assertions(1)
    return runAuthenticatedQuery(mutation, rootValue).then(
      ({ sendConversationMessage }) => {
        expect(sendConversationMessage).toMatchSnapshot()
      }
    )
  })
})
