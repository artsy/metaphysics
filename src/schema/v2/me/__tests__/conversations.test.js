/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Conversations", () => {
  describe("Partner", () => {
    it("throws error if no partnerId is passed", () => {
      const query = `
        {
          me {
            conversationsConnection(first: 10, type: PARTNER) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const context = {
        meLoader: () => Promise.resolve({}),
        conversationsLoader: () =>
          Promise.resolve({
            conversations: [],
          }),
      }

      return runAuthenticatedQuery(query, context).catch((error) => {
        expect(error.message).toInclude("Argument `partnerId` is required.")
      })
    })

    it("returns conversations for partner", () => {
      const query = `
        {
          me {
            conversationsConnection(first: 10, type: PARTNER, partnerId: "foo") {
              edges {
                node {
                  internalID
                  initialMessage
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
        edges: [
          {
            node: {
              internalID: "2",
              initialMessage: "omg im sooo interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
          {
            node: {
              internalID: "3",
              initialMessage: "im only a little interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
        ],
      }

      const context = {
        meLoader: () => Promise.resolve({}),
        conversationsLoader: () =>
          Promise.resolve({
            total_unread_count: 1,
            total_count: 2,
            conversations: [conversation1, conversation2],
          }),
      }

      return runAuthenticatedQuery(query, context).then(
        ({ me: { conversationsConnection } }) => {
          expect(conversationsConnection).toEqual(expectedConversationData)
        }
      )
    })
  })

  describe("User", () => {
    it("returns conversations for users", () => {
      const query = `
        {
          me {
            conversationsConnection(first: 10, type: USER) {
              totalUnreadCount
              edges {
                node {
                  internalID
                  initialMessage
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
              internalID: "2",
              initialMessage: "omg im sooo interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
          {
            node: {
              internalID: "3",
              initialMessage: "im only a little interested",
              from: {
                email: "percy@cat.com",
              },
            },
          },
        ],
      }

      const context = {
        meLoader: () => Promise.resolve({}),
        conversationsLoader: () =>
          Promise.resolve({
            total_unread_count: 1,
            total_count: 2,
            conversations: [conversation1, conversation2],
          }),
      }

      return runAuthenticatedQuery(query, context).then(
        ({ me: { conversationsConnection } }) => {
          expect(conversationsConnection).toEqual(expectedConversationData)
        }
      )
    })
  })
})
