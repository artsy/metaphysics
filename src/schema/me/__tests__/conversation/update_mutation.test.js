import { runAuthenticatedQuery } from "test/utils"

describe("UpdateConversationMutation", () => {
  it("updates and returns a conversation", () => {
    const mutation = `
      mutation {
        updateConversation(input: { ids: ["3"], buyer_outcome: HIGH_PRICE }) {
          conversations {
            id
            initial_message
            from {
              email
            }
          }
        }
      }
    `

    const rootValue = {
      conversationUpdateLoader: () =>
        Promise.resolve({
          id: "3",
          initial_message: "omg im sooo interested",
          from_email: "percy@cat.com",
        }),
    }

    return runAuthenticatedQuery(mutation, rootValue).then(({ updateConversation }) => {
      expect(updateConversation).toMatchSnapshot()
    })
  })
})
