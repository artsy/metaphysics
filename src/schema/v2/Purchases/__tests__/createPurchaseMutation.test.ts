import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createPurchaseMutation", () => {
  const mutation = gql`
    mutation {
      createPurchase(
        input: {
          artsyCommission: 10.5
          artworkID: "some-artwork-id"
          discoverAdminID: "nikita-admin-id"
          email: "nikita@artsy.net"
          fairID: "some-fair-id"
          note: "My note"
          ownerID: "sale-artwork-id"
          ownerType: "SaleArtwork"
          saleDate: "2025-06-13"
          saleAdminID: "nikita-sale-admin-id"
          saleID: "some-sale-id"
          salePrice: 999.99
          source: "auction"
          userID: "some-user-id"
        }
      ) {
        responseOrError {
          __typename
          ... on CreatePurchaseSuccess {
            purchase {
              internalID
              artsyCommission
              artwork {
                internalID
              }
              discoverAdmin {
                internalID
              }
              email
              fair {
                internalID
              }
              note
              ownerID
              ownerType
              saleDate
              saleAdmin {
                internalID
              }
              sale {
                internalID
              }
              salePrice
              source
              user {
                internalID
              }
            }
          }
        }
      }
    }
  `

  const purchase = {
    id: "purchase-id",
    artsy_commission: 10.5,
    artwork: {
      _id: "some-artwork-id",
    },
    discover_admin: {
      id: "nikita-admin-id",
    },
    email: "nikita@artsy.net",
    fair: {
      _id: "some-fair-id",
    },
    note: "My note",
    owner_id: "sale-artwork-id",
    owner_type: "SaleArtwork",
    sale_date: "2025-06-13",
    sale_admin: {
      id: "nikita-sale-admin-id",
    },
    sale: {
      _id: "some-sale-id",
    },
    sale_price: 999.99,
    source: "auction",
    user: {
      id: "some-user-id",
    },
  }

  const mockCreatePurchaseLoader = jest.fn()

  const context = {
    createPurchaseLoader: mockCreatePurchaseLoader,
  }

  beforeEach(() => {
    mockCreatePurchaseLoader.mockResolvedValue(Promise.resolve(purchase))
  })

  afterEach(() => {
    mockCreatePurchaseLoader.mockReset()
  })

  it("asserts that the loader is called with the correct arguments and returns the purchase", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    const loaderArgs = mockCreatePurchaseLoader.mock.calls[0]
    const params = loaderArgs[0]

    expect(params).toMatchObject({
      artsy_commission: 10.5,
      artwork_id: "some-artwork-id",
      discover_admin_id: "nikita-admin-id",
      email: "nikita@artsy.net",
      fair_id: "some-fair-id",
      note: "My note",
      owner_id: "sale-artwork-id",
      owner_type: "SaleArtwork",
      sale_date: 1749772800,
      sale_admin_id: "nikita-sale-admin-id",
      sale_id: "some-sale-id",
      sale_price: 999.99,
      source: "auction",
      user_id: "some-user-id",
    })

    expect(res).toMatchInlineSnapshot(`
      {
        "createPurchase": {
          "responseOrError": {
            "__typename": "CreatePurchaseSuccess",
            "purchase": {
              "artsyCommission": 10.5,
              "artwork": {
                "internalID": "some-artwork-id",
              },
              "discoverAdmin": {
                "internalID": "nikita-admin-id",
              },
              "email": "nikita@artsy.net",
              "fair": {
                "internalID": "some-fair-id",
              },
              "internalID": "purchase-id",
              "note": "My note",
              "ownerID": "sale-artwork-id",
              "ownerType": "SaleArtwork",
              "sale": {
                "internalID": "some-sale-id",
              },
              "saleAdmin": {
                "internalID": "nikita-sale-admin-id",
              },
              "saleDate": "2025-06-13",
              "salePrice": 999.99,
              "source": "auction",
              "user": {
                "internalID": "some-user-id",
              },
            },
          },
        },
      }
    `)
  })
})
