import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = `
  mutation {
    markNotificationAsRead(input: { id: "feed_id" }) {
      responseOrError {
        ... on MarkNotificationAsReadSuccess {
          success
        }

        ... on MarkNotificationAsReadFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("markNotificationAsReadMutation", () => {
  it("returns success response", async () => {
    const context = {
      updateNotificationsLoader: jest.fn().mockResolvedValue(true),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "markNotificationAsRead": {
          "responseOrError": {
            "success": true,
          },
        },
      }
    `)
  })

  it("returns failure when something went wrong", async () => {
    const message = `https://stagingapi.artsy.net/api/v1/me/notifications - {"error":"Something went wrong"}`
    const error = new Error(message)
    const context = {
      updateNotificationsLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "markNotificationAsRead": {
          "responseOrError": {
            "mutationError": {
              "message": "Something went wrong",
            },
          },
        },
      }
    `)
  })
})
