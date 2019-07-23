/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Me", () => {
  describe("Conversations", () => {
    it("returns conversations", () => {
      const query = `
        {
          me {
            conversations(first: 10) {
              totalUnreadCount
              edges {
                node {
                  id
                  initial_message
                  from {
                    email
                  }
                }
              }
            }
          }
        }
      `

      const conversation1 = {
        id: "2",
        initial_message: "omg im sooo interested",
        from_email: "percy@cat.com",
      }
      const conversation2 = {
        id: "3",
        initial_message: "im only a little interested",
        from_email: "percy@cat.com",
      }

      const expectedConversationData = {
        totalUnreadCount: 1,
        edges: [
          {
            node: {
              id: "2",
              initial_message: "omg im sooo interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
          {
            node: {
              id: "3",
              initial_message: "im only a little interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
        ],
      }

      return runAuthenticatedQuery(query, {
        conversationsLoader: () =>
          Promise.resolve({
            total_unread_count: 1,
            total_count: 2,
            conversations: [conversation1, conversation2],
          }),
      }).then(({ me: { conversations } }) => {
        expect(conversations).toEqual(expectedConversationData)
      })
    })
  })
})
