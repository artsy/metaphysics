import { runAuthenticatedQuery } from "test/utils"

describe("MarkReadMessageMutation", () => {
  it("marks a message as read", () => {
    const mutation = `
      mutation {
        markReadMessage(input: { conversationId: "25", deliveryId: "35" }) {
          delivery {
            id
            opened_at
          }
        }
      }
    `

    const rootValue = {
      markMessageReadLoader: () =>
        Promise.resolve({
          id: "3",
          opened_at: "now",
        }),
    }

    return runAuthenticatedQuery(mutation, rootValue).then(updatedDelivery => {
      expect(updatedDelivery).toMatchSnapshot()
    })
  })
})
