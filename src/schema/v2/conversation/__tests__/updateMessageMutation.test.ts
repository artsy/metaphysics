import gql from "lib/gql"
import { HTTPError } from "lib/HTTPError"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("UpdateMessageMutation", () => {
  const mutation = gql`
    mutation {
      updateMessage(input: { id: "25", spam: true }) {
        conversationOrError {
          __typename
          ... on updateMessageSuccess {
            conversation {
              initialMessage
            }
          }
          ... on updateMessageFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  it("marks the message as spam", async () => {
    const context = {
      messageUpdateLoader: () =>
        Promise.resolve({
          id: "foo",
          initial_message: "Howdy",
          from_email_address: "percy@cat.com",
        }),
    }

    const updatedMessage = await runAuthenticatedQuery(mutation, context)

    expect(updatedMessage).toEqual({
      updateMessage: {
        conversationOrError: {
          __typename: "updateMessageSuccess",
          conversation: {
            initialMessage: "Howdy",
          },
        },
      },
    })
  })

  describe("when failure", () => {
    it("returns an error", async () => {
      const context = {
        messageUpdateLoader: () =>
          Promise.reject(new HTTPError(`Oops`, 500, "Error from API")),
      }

      const updatedMessage = await runAuthenticatedQuery(mutation, context)

      expect(updatedMessage).toEqual({
        updateMessage: {
          conversationOrError: {
            __typename: "updateMessageFailure",
            mutationError: {
              message: "Error from API",
            },
          },
        },
      })
    })
  })
})
