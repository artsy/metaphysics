import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Send confirmation email mutation", () => {
  const successResponse = {
    id: "foo",
    confirmation_sent_at: "2020-05-18T12:00:00+00:00",
    unconfirmed_email: "yuki@awesomemail.com",
  }

  const query = `
    mutation {
      sendConfirmationEmail(input: { }) {
        confirmationOrError {
          ... on SendConfirmationEmailMutationSuccess {
            confirmationSentAt
            unconfirmedEmail
          }
          ... on SendConfirmationEmailMutationFailure {
            mutationError {
              message
            }
          }
        }
      }
    }
  `

  const context = {
    sendConfirmationEmailLoader: () => Promise.resolve(successResponse),
  }

  it("sends a confirmation email", async () => {
    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      sendConfirmationEmail: {
        confirmationOrError: {
          confirmationSentAt: "2020-05-18T12:00:00+00:00",
          unconfirmedEmail: "yuki@awesomemail.com",
        },
      },
    })
  })

  it("returns a SendConfirmationEmailMutationFailure object when the user's email is already confirmed", async () => {
    const context = {
      sendConfirmationEmailLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/me/confirmation_emails - {"error":"email is already confirmed"}`
          )
        ),
    }

    const data = await runAuthenticatedQuery(query, context)

    expect(data).toEqual({
      sendConfirmationEmail: {
        confirmationOrError: {
          mutationError: {
            message: "email is already confirmed",
          },
        },
      },
    })
  })

  it("throws an error if the user is not signed in", () => {
    const context = {
      sendConfirmationEmailLoader: undefined,
    }

    return runAuthenticatedQuery(query, context).catch((error) => {
      expect(error.message).toEqual(
        "You need to be signed in to perform this action"
      )
    })
  })

  it("throws an error if there is one we don't recognize", () => {
    const errorRootValue = {
      sendConfirmationEmailLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }

    return runAuthenticatedQuery(query, errorRootValue).catch((error) => {
      expect(error.message).toEqual("ETIMEOUT service unreachable")
    })
  })
})
