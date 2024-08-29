import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("partner.merchantAccountsConnection", () => {
  let response
  let context

  beforeEach(() => {
    response = [
      {
        external_id: "stripe-account-1",
      },
    ]
    const partnerMerchantAccountsLoader = () => {
      return Promise.resolve({
        body: response,
        headers: {
          "x-total-count": response.length,
        },
      })
    }

    context = {
      partnerLoader: () => {
        return Promise.resolve({
          _id: "partnerID",
        })
      },
      partnerMerchantAccountsLoader: partnerMerchantAccountsLoader,
    }
  })

  it("returns merchant accounts", async () => {
    const query = gql`
      {
        partner(id: "partnerID") {
          merchantAccountsConnection(first: 1) {
            edges {
              node {
                externalId
              }
            }
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        merchantAccountsConnection: {
          edges: [
            {
              node: {
                externalId: "stripe-account-1",
              },
            },
          ],
        },
      },
    })
  })

  it("loads the total count", async () => {
    const query = gql`
      {
        partner(id: "partnerID") {
          merchantAccountsConnection(first: 1) {
            totalCount
          }
        }
      }
    `

    const data = await runQuery(query, context)
    expect(data).toEqual({
      partner: {
        merchantAccountsConnection: {
          totalCount: 1,
        },
      },
    })
  })
})
