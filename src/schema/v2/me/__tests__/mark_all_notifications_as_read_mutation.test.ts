import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = `
  mutation {
    markAllNotificationsAsRead(input: {}) {
      responseOrError {
        ... on MarkAllNotificationsAsReadSuccess {
          success
        }
        
        ... on MarkAllNotificationsAsReadFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("markAllNotificationsAsReadMutation", () => {
  it("should return success response when all unread notifications are marked as read", async () => {
    const context = {
      updateNotificationsLoader: jest.fn().mockResolvedValue(true),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "markAllNotificationsAsRead": Object {
          "responseOrError": Object {
            "success": true,
          },
        },
      }
    `)
  })

  it("should return failure response when something went wrong", async () => {
    const message = `https://stagingapi.artsy.net/api/v1/me/notifications - {"error":"Something went wrong"}`
    const error = new Error(message)
    const context = {
      updateNotificationsLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "markAllNotificationsAsRead": Object {
          "responseOrError": Object {
            "mutationError": Object {
              "message": "Something went wrong",
            },
          },
        },
      }
    `)
  })
})
