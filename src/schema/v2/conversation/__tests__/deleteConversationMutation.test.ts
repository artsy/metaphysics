import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("DeleteConversationMutation", () => {
  it("deletes a conversation", async () => {
    const mutation = `
      mutation {
        deleteConversation(input: { id: "25" }) {
          conversation {
            deletedAt
          }
        }
      }
    `

    const context = {
      conversationDeleteLoader: () =>
        Promise.resolve({
          deleted_at: "2022",
        }),
    }

    try {
      const deletedConversation = await runAuthenticatedQuery(mutation, context)
      expect(deletedConversation).toEqual("2022")
    } catch (error) {
      console.log(error)
    }
  })
})
