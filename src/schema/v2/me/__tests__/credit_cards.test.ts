/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("CreditCards", () => {
  it("returns a credit card connection", () => {
    const creditCards = [
      { id: "12345", brand: "Visa", last_digits: "1234" },
      { id: "6789", brand: "Mastercard", last_digits: "6789" },
    ]
    const context = {
      meCreditCardsLoader: () =>
        Promise.resolve({
          body: creditCards,
          headers: { "x-total-count": "2" },
        }),
    }
    const query = gql`
      {
        me {
          creditCards(first: 1) {
            edges {
              node {
                internalID
                brand
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      }
    `

    expect.assertions(1)
    return runAuthenticatedQuery(query, context).then((data) => {
      expect(data!.me.creditCards).toEqual({
        edges: [
          {
            node: {
              internalID: "12345",
              brand: "Visa",
            },
          },
        ],
        pageInfo: {
          hasNextPage: true,
        },
      })
    })
  })
})
