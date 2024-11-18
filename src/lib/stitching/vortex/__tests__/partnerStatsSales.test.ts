import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"

jest.mock("../link")
require("../link").mockFetch as jest.Mock<any>

describe("PartnerStatsSales type", () => {
  const partnerLoader = jest.fn(() =>
    Promise.resolve({ _id: "5748d153cd530e2d5100031c" })
  )
  const context: Partial<ResolverContext> = {
    partnerLoader,
  }

  it("is accessible through the partner type", async () => {
    const query = gql`
      query {
        partner(id: "5748d153cd530e2d5100031c") {
          analytics {
            sales(period: FOUR_WEEKS) {
              partnerId
              totalCents
              timeSeries {
                startTime
                endTime
                totalCents
              }
            }
          }
        }
      }
    `
    const result = await runQuery(query, context)
    expect(result).toMatchInlineSnapshot(`
      {
        "partner": {
          "analytics": {
            "sales": {
              "partnerId": "5748d153cd530e2d5100031c",
              "timeSeries": [
                {
                  "endTime": "2019-05-05T00:00:00Z",
                  "startTime": "2019-05-04T00:00:00Z",
                  "totalCents": 0,
                },
                {
                  "endTime": "2019-05-06T00:00:00Z",
                  "startTime": "2019-05-05T00:00:00Z",
                  "totalCents": 280000,
                },
              ],
              "totalCents": 3682500,
            },
          },
        },
      }
    `)
  })

  it("exposes formatted total fields", async () => {
    const query = gql`
      query {
        partner(id: "5748d153cd530e2d5100031c") {
          analytics {
            sales(period: FOUR_WEEKS) {
              partnerId
              totalCents
              total
              timeSeries {
                startTime
                endTime
                totalCents
                total(
                  symbol: "¥"
                  precision: 3
                  format: "%v %s"
                  thousand: "|"
                  decimal: "。"
                )
              }
            }
          }
        }
      }
    `
    const result = await runQuery(query, context)
    expect(result).toMatchInlineSnapshot(`
      {
        "partner": {
          "analytics": {
            "sales": {
              "partnerId": "5748d153cd530e2d5100031c",
              "timeSeries": [
                {
                  "endTime": "2019-05-05T00:00:00Z",
                  "startTime": "2019-05-04T00:00:00Z",
                  "total": "0。000 ¥",
                  "totalCents": 0,
                },
                {
                  "endTime": "2019-05-06T00:00:00Z",
                  "startTime": "2019-05-05T00:00:00Z",
                  "total": "2|800。000 ¥",
                  "totalCents": 280000,
                },
              ],
              "total": "$36,825",
              "totalCents": 3682500,
            },
          },
        },
      }
    `)
  })
})
