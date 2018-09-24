/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "test/utils"

describe("Delete card mutation", () => {
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
    deleteCreditCard(input: {id: "foo-foo"}) {
      creditCardOrError {
        ... on CreditCardMutationSuccess {
          creditCard {
            id
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

  const rootValue = {
    deleteCreditCardLoader: () => Promise.resolve(creditCard),
  }

  it("deletes a credit card with an error message", async () => {
    const errorRootValue = {
      deleteCreditCardLoader: () =>
        Promise.reject(
          new Error(
            `https://stagingapi.artsy.net/api/v1/me/credit_cards?id=foo - {"error":"Card Not Found"}`
          )
        ),
    }
    const data = await runAuthenticatedQuery(query, errorRootValue)
    expect(data).toEqual({
      deleteCreditCard: {
        creditCardOrError: {
          mutationError: {
            detail: null,
            message: "Card Not Found",
            type: "error",
          },
        },
      },
    })
  })

  it("throws an error if there is one we don't recognize", async () => {
    const errorRootValue = {
      deleteCreditCardLoader: () => {
        throw new Error("ETIMEOUT service unreachable")
      },
    }
    runAuthenticatedQuery(query, errorRootValue).catch(error => {
      expect(error.message).toEqual("ETIMEOUT service unreachable")
    })
  })

  it("deletes a credit card successfully", async () => {
    const data = await runAuthenticatedQuery(query, rootValue)
    expect(data).toEqual({
      deleteCreditCard: {
        creditCardOrError: { creditCard: { id: "foo-foo" } },
      },
    })
  })
})
