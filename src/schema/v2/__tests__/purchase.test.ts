import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"
import sinon from "sinon"

describe("purchase", () => {
  const purchaseMockData = {
    id: "purchase-id",
    artsy_commission: 25.5,
    artwork: { _id: "artwork-id" },
    created_at: "2025-04-14T00:00:00Z",
    discover_admin: { id: "discover-user-id" },
    email: "email@example.com",
    fair: { _id: "fair-id" },
    note: "Test purchase",
    owner_type: "bid",
    sale: { _id: "sale-id" },
    sale_admin: { id: "sale-user-id" },
    sale_price: 1984,
    sale_date: "2025-04-14T00:00:00Z",
    source: "auction",
    user: { id: "user-id" },
  }

  it("resolves a purchase", async () => {
    const context = {
      purchaseLoader: sinon
        .stub()
        .withArgs({
          id: "purchase-id",
        })
        .returns(Promise.resolve(purchaseMockData)),
    }

    const query = gql`
      {
        purchase(id: "purchase-id") {
          internalID
          artsyCommission
          artwork {
            internalID
          }
          createdAt
          discoverAdmin {
            internalID
          }
          email
          fair {
            internalID
          }
          note
          ownerType
          sale {
            internalID
          }
          saleAdmin {
            internalID
          }
          salePrice
          saleDate
          source
          user {
            internalID
          }
        }
      }
    `

    const { purchase } = await runQuery(query, context)

    expect(purchase).toMatchInlineSnapshot(`
      {
        "artsyCommission": 25.5,
        "artwork": {
          "internalID": "artwork-id",
        },
        "createdAt": "2025-04-14T00:00:00Z",
        "discoverAdmin": {
          "internalID": "discover-user-id",
        },
        "email": "email@example.com",
        "fair": {
          "internalID": "fair-id",
        },
        "internalID": "purchase-id",
        "note": "Test purchase",
        "ownerType": "bid",
        "sale": {
          "internalID": "sale-id",
        },
        "saleAdmin": {
          "internalID": "sale-user-id",
        },
        "saleDate": "2025-04-14T00:00:00Z",
        "salePrice": 1984,
        "source": "auction",
        "user": {
          "internalID": "user-id",
        },
      }
    `)

    expect(context.purchaseLoader.callCount).toEqual(1)
    expect(context.purchaseLoader.args[0][0]).toEqual("purchase-id")
  })

  it("throws an error if purchaseLoader is not available", async () => {
    const context = {}

    const query = gql`
      {
        purchase(id: "purchase-id") {
          internalID
        }
      }
    `

    await expect(runQuery(query, context)).rejects.toThrow(
      "A X-Access-Token header is required to perform this action."
    )
  })
})
