import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = `
  mutation {
    markAllNotificationsAsRead(input: {}) {
      success
    }
  }
`

describe("markAllNotificationsAsReadMutation", () => {
  it("should return success = true when all unread notifications are marked as read", async () => {
    const context = {
      updateNotificationsLoader: jest.fn().mockResolvedValue(true),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "markAllNotificationsAsRead": Object {
          "success": true,
        },
      }
    `)
  })

  it("should return success = false when something went wrong", async () => {
    const error = new Error("Some Error")
    const context = {
      updateNotificationsLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      Object {
        "markAllNotificationsAsRead": Object {
          "success": false,
        },
      }
    `)
  })
})
