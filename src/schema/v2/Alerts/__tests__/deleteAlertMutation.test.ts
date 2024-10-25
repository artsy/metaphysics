import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("deleteAlertMutation", () => {
  const mutation = gql`
    mutation {
      deleteAlert(input: { id: "alert-id" }) {
        responseOrError {
          __typename
          ... on DeleteAlertSuccess {
            alert {
              artistsConnection(first: 10) {
                edges {
                  node {
                    name
                  }
                }
              }
              internalID
              settings {
                email
                push
                frequency
              }
            }
          }
        }
      }
    }
  `

  const alert = {
    search_criteria: {
      artist_ids: ["catty-artist-id"],
    },
    id: "alert-id",
    email: true,
    push: true,
    frequency: "daily",
  }

  const mockMeDeleteAlertLoader = jest.fn()

  const context = {
    meDeleteAlertLoader: mockMeDeleteAlertLoader,
    artistsLoader: jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ name: "Catty Artist" }],
        headers: {
          "x-total-count": "1",
        },
      })
    ),
  }

  beforeEach(() => {
    mockMeDeleteAlertLoader.mockResolvedValue(Promise.resolve(alert))
  })

  afterEach(() => {
    mockMeDeleteAlertLoader.mockReset()
  })

  it("returns a deleted alert", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      {
        "deleteAlert": {
          "responseOrError": {
            "__typename": "DeleteAlertSuccess",
            "alert": {
              "artistsConnection": {
                "edges": [
                  {
                    "node": {
                      "name": "Catty Artist",
                    },
                  },
                ],
              },
              "internalID": "alert-id",
              "settings": {
                "email": true,
                "frequency": "DAILY",
                "push": true,
              },
            },
          },
        },
      }
    `)
  })

  it("calls the loader with the correct input", async () => {
    await runAuthenticatedQuery(mutation, context)

    expect(mockMeDeleteAlertLoader).toBeCalledWith("alert-id")
  })
})
