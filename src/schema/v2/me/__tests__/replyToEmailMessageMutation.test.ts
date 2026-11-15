import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

const mutation = `
  mutation {
    replyToEmailMessage(input: { id: "msg-1", bodyHTML: "<p>Thanks!</p>" }) {
      replyOrError {
        __typename
        ... on ReplyToEmailMessageSuccess {
          reply {
            providerMessageID
            providerThreadID
            rfcMessageID
          }
        }
        ... on ReplyToEmailMessageFailure {
          mutationError { message statusCode }
        }
      }
    }
  }
`

describe("replyToEmailMessage", () => {
  it("sends the reply and returns the provider IDs", async () => {
    const replyToEmailMessageLoader = jest.fn().mockResolvedValue({
      provider_message_id: "sent-1",
      provider_thread_id: "t-1",
      rfc_message_id: "<x@example.com>",
    })

    const result = await runAuthenticatedQuery(mutation, {
      replyToEmailMessageLoader,
    })

    expect(replyToEmailMessageLoader).toHaveBeenCalledWith("msg-1", {
      body_html: "<p>Thanks!</p>",
    })
    expect(result.replyToEmailMessage.replyOrError).toEqual({
      __typename: "ReplyToEmailMessageSuccess",
      reply: {
        providerMessageID: "sent-1",
        providerThreadID: "t-1",
        rfcMessageID: "<x@example.com>",
      },
    })
  })

  it("returns a failure when Gravity rejects the reply", async () => {
    const result = await runAuthenticatedQuery(mutation, {
      replyToEmailMessageLoader: jest.fn().mockRejectedValue(
        new HTTPError("Gravity error", 400, {
          type: "param_error",
          message: "Account is not active",
        } as any)
      ),
    })

    expect(result.replyToEmailMessage.replyOrError).toEqual({
      __typename: "ReplyToEmailMessageFailure",
      mutationError: { message: "Account is not active", statusCode: 400 },
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in to perform this action"
    )
  })
})
