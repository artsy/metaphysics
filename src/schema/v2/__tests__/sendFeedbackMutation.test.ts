/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Send Feedback", () => {
  const feedback = {
    id: "id",
    message: "Catty message",
  }

  const query = `
  mutation {
    sendFeedback(input: {message: "Catty message"}) {
      feedbackOrError {
        ... on SendFeedbackMutationSuccess {
          feedback {
            message
          }
        }
        ... on SendFeedbackMutationFailure {
          mutationError {
            type
            message
            detail
          }
        }
      }
    }
  }
  `

  const context = {
    sendFeedbackLoader: () => Promise.resolve(feedback),
  }

  it("returns a formatted error message", async () => {
    const errorRootValue = {
      sendFeedbackLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/feedback - {"error":"Message Cant Not Be Blank"}`
          )
        ),
    }
    const data = await runAuthenticatedQuery(query, errorRootValue)
    expect(data).toEqual({
      sendFeedback: {
        feedbackOrError: {
          mutationError: {
            detail: null,
            message: "Message Cant Not Be Blank",
            type: "error",
          },
        },
      },
    })
  })

  it("sends a feedback message", async () => {
    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      sendFeedback: {
        feedbackOrError: { feedback: { message: "Catty message" } },
      },
    })
  })
})
