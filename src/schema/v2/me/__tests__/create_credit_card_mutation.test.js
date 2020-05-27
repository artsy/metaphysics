/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("Credit card mutation", () => {
  const creditCard = {
    id: "foo-foo",
    _id: "123",
    name: "Foo User",
    last_digits: "1234",
    expiration_month: 3,
    expiration_year: 2018,
  }

  const query = `
  mutation {
    createCreditCard(input: {token: "tok_foo", oneTimeUse: true}) {
      creditCardOrError {
        ... on CreditCardMutationSuccess {
          creditCard {
            internalID
          }
        }
        ... on CreditCardMutationFailure {
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
    createCreditCardLoader: () => Promise.resolve(creditCard),
  }

  it("creates a credit card and returns an edge", async () => {
    const edgeQuery = `
    mutation {
      createCreditCard(input: {token: "tok_foo", oneTimeUse: true}) {
        creditCardOrError {
          ... on CreditCardMutationSuccess {
            creditCardEdge {
              node {
                internalID
                name
                lastDigits
                expirationMonth
                expirationYear
              }
            }
          }
          ... on CreditCardMutationFailure {
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
    const data = await runAuthenticatedQuery(edgeQuery, context)
    expect(data).toEqual({
      createCreditCard: {
        creditCardOrError: {
          creditCardEdge: {
            node: {
              internalID: "foo-foo",
              name: "Foo User",
              lastDigits: "1234",
              expirationMonth: 3,
              expirationYear: 2018,
            },
          },
        },
      },
    })
  })

  it("creates a credit card with an error message", async () => {
    const errorRootValue = {
      createCreditCardLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/me/credit_cards?provider=stripe&token=tok_chargeDeclinedExpiredCard&one_time_use=true - {"type":"payment_error","message":"Payment information could not be processed.","detail":"Your card has expired."}`
          )
        ),
    }
    const data = await runAuthenticatedQuery(query, errorRootValue)
    expect(data).toEqual({
      createCreditCard: {
        creditCardOrError: {
          mutationError: {
            detail: "Your card has expired.",
            message: "Payment information could not be processed.",
            type: "payment_error",
          },
        },
      },
    })
  })

  it("throws an error if there is one we don't recognize", async () => {
    const errorRootValue = {
      createCreditCardLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }
    runAuthenticatedQuery(query, errorRootValue).catch((error) => {
      expect(error.message).toEqual("ETIMEOUT service unreachable")
    })
  })

  it("creates a credit card successfully", async () => {
    const data = await runAuthenticatedQuery(query, context)
    expect(data).toEqual({
      createCreditCard: {
        creditCardOrError: { creditCard: { internalID: "foo-foo" } },
      },
    })
  })
})
