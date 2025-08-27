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
        meLoader: jest.fn().mockResolvedValue({}),
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
        meLoader: jest.fn().mockResolvedValue({}),
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

    it("passes conversationType parameter to loader for partner conversations", () => {
      const query = `
        {
          me {
            conversationsConnection(first: 10, type: PARTNER, partnerId: "foo", conversationType: INQUIRY) {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const mockConversationsLoader = jest.fn(() =>
        Promise.resolve({
          total_unread_count: 0,
          total_count: 1,
          conversations: [{ id: "1" }],
        })
      )

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        conversationsLoader: mockConversationsLoader,
      }

      return runAuthenticatedQuery(query, context).then(() => {
        expect(mockConversationsLoader).toHaveBeenCalledWith(
          expect.objectContaining({
            conversation_type: "inquiry",
          })
        )
      })
    })

    it("passes artworkId parameter to loader for partner conversations", () => {
      const query = `
        {
          me {
            conversationsConnection(first: 10, type: PARTNER, partnerId: "foo", artworkId: "artwork-123") {
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `

      const mockConversationsLoader = jest.fn(() =>
        Promise.resolve({
          total_unread_count: 0,
          total_count: 1,
          conversations: [{ id: "1" }],
        })
      )

      const context = {
        meLoader: jest.fn().mockResolvedValue({}),
        conversationsLoader: mockConversationsLoader,
      }

      return runAuthenticatedQuery(query, context).then(() => {
        expect(mockConversationsLoader).toHaveBeenCalledWith(
          expect.objectContaining({
            artwork_id: "artwork-123",
          })
        )
      })
    })
  })

  describe("User", () => {
    it("returns conversations for users", () => {
      const query = `
        {
          me {
            conversationsConnection(first: 10, type: USER) {
              totalCount
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
        totalCount: 2,
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
        meLoader: jest.fn().mockResolvedValue({}),
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

    it("defaults to type: USER", () => {
      const query = `
        {
          me {
            conversationsConnection(first: 10) {
              totalCount
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
        totalCount: 2,
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
        meLoader: jest.fn().mockResolvedValue({}),
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
