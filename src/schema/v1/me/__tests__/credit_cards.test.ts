/* eslint-disable promise/always-return */
import { runAuthenticatedQuery } from "schema/v1/test/utils"
import gql from "lib/gql"

describe("CreditCards", () => {
  let context: any
  beforeEach(() => {
    const creditCards = [
      { id: "12345", brand: "Visa" },
      { id: "6789", brand: "Mastercard" },
    ]
    context = {
      meCreditCardsLoader: () =>
        Promise.resolve({ body: creditCards, headers: { "x-total-count": 2 } }),
    }
  })

  it("returns a credit card connection", () => {
    const query = gql`
      {
        me {
          creditCards(first: 1) {
            edges {
              node {
                id
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
              id: "12345",
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
