import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deletePurchaseMutation", () => {
  const mutation = gql`
    mutation {
      deletePurchase(input: { id: "purchase-id" }) {
        responseOrError {
          __typename
          ... on DeletePurchaseSuccess {
            purchase {
              internalID
              artwork {
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
    artwork: {
      _id: "some-artwork-id",
    },
  }

  const mockDeletePurchaseLoader = jest.fn()

  const context = {
    deletePurchaseLoader: mockDeletePurchaseLoader,
  }

  beforeEach(() => {
    mockDeletePurchaseLoader.mockResolvedValue(Promise.resolve(purchase))
  })

  afterEach(() => {
    mockDeletePurchaseLoader.mockReset()
  })

  it("calls the loader with the correct input and returns a deleted purchase", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    const loaderArgs = mockDeletePurchaseLoader.mock.calls[0]
    const id = loaderArgs[0]

    expect(id).toEqual("purchase-id")
    expect(res).toMatchInlineSnapshot(`
      {
        "deletePurchase": {
          "responseOrError": {
            "__typename": "DeletePurchaseSuccess",
            "purchase": {
              "artwork": {
                "internalID": "some-artwork-id",
              },
              "internalID": "purchase-id",
            },
          },
        },
      }
    `)
  })
})
