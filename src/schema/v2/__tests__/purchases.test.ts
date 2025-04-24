import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("purchases", () => {
  describe("purchasesConnection", () => {
    const purchasesMockData = [
      {
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
      },
    ]

    it("resolves a connection with all query arguments", async () => {
      const purchasesLoader = jest.fn().mockResolvedValue({
        headers: { "x-total-count": 1 },
        body: purchasesMockData,
      })
      const context = {
        purchasesLoader,
      }

      const query = gql`
        {
          purchasesConnection(
            first: 5
            artworkId: "artwork-id"
            artistId: "artist-id"
            saleId: "sale-id"
            userId: "user-id"
          ) {
            totalCount
            edges {
              node {
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
          }
        }
      `

      const { purchasesConnection } = await runQuery(query, context)

      expect(purchasesConnection).toMatchInlineSnapshot(`
        {
          "edges": [
            {
              "node": {
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
              },
            },
          ],
          "totalCount": 1,
        }
      `)

      expect(purchasesLoader).toHaveBeenCalledTimes(1)
      expect(purchasesLoader).toHaveBeenCalledWith({
        artwork_id: "artwork-id",
        artist_id: "artist-id",
        sale_id: "sale-id",
        user_id: "user-id",
        page: 1,
        size: 5,
        total_count: true,
      })
    })

    it("only passes non-empty arguments to the loader", async () => {
      const purchasesLoader = jest.fn().mockResolvedValue({
        headers: { "x-total-count": 1 },
        body: purchasesMockData,
      })
      const context = {
        purchasesLoader,
      }

      const query = gql`
        {
          purchasesConnection(first: 5, artworkId: "artwork-id") {
            totalCount
            edges {
              node {
                internalID
              }
            }
          }
        }
      `

      const { purchasesConnection } = await runQuery(query, context)

      expect(purchasesConnection.totalCount).toEqual(1)
      expect(purchasesConnection.edges[0].node).toEqual({
        internalID: "purchase-id",
      })

      expect(purchasesLoader).toHaveBeenCalledTimes(1)
      expect(purchasesLoader).toHaveBeenCalledWith({
        artwork_id: "artwork-id",
        page: 1,
        size: 5,
        total_count: true,
      })
    })

    it("throws an error if purchasesLoader is not available", async () => {
      const context = {}

      const query = gql`
        {
          purchasesConnection(first: 5, artworkId: "artwork-id") {
            totalCount
            edges {
              node {
                internalID
              }
            }
          }
        }
      `

      await expect(runQuery(query, context)).rejects.toThrow(
        "A X-Access-Token header is required to perform this action."
      )
    })
  })
})
