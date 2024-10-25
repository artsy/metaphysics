import { runAuthenticatedQuery } from "schema/v2/test/utils"

const mutation = `
  mutation {
    markNotificationsAsSeen(input: { until: "2023-01-30T11:03:19Z" }) {
      responseOrError {
        ... on MarkNotificationsAsSeenSuccess {
          success
        }

        ... on MarkNotificationsAsSeenFailure {
          mutationError {
            message
          }
        }
      }
    }
  }
`

describe("markNotificationsAsSeenMutation", () => {
  it("should return success response", async () => {
    const context = {
      markNotificationsAsSeenLoader: jest.fn().mockResolvedValue(true),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "markNotificationsAsSeen": {
          "responseOrError": {
            "success": true,
          },
        },
      }
    `)
  })

  it("should return failure response when something went wrong", async () => {
    const message = `https://stagingapi.artsy.net/api/v1/me/notifications/mark_as_seen - {"error":"Something went wrong"}`
    const error = new Error(message)
    const context = {
      markNotificationsAsSeenLoader: jest.fn().mockRejectedValue(error),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result).toMatchInlineSnapshot(`
      {
        "markNotificationsAsSeen": {
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
