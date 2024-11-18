import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("createAlertMutation", () => {
  const mutation = gql`
    mutation {
      createAlert(
        input: {
          artistIDs: ["catty-artist-id"]
          settings: { email: true, push: true, frequency: DAILY }
        }
      ) {
        responseOrError {
          __typename
          ... on CreateAlertSuccess {
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

  const mockMeCreateAlertLoader = jest.fn()

  const context = {
    meCreateAlertLoader: mockMeCreateAlertLoader,
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
    mockMeCreateAlertLoader.mockResolvedValue(Promise.resolve(alert))
  })

  afterEach(() => {
    mockMeCreateAlertLoader.mockReset()
  })

  it("returns a created alert", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      {
        "createAlert": {
          "responseOrError": {
            "__typename": "CreateAlertSuccess",
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

    const loaderArgs = mockMeCreateAlertLoader.mock.calls[0][0]
    expect(loaderArgs).toMatchObject({
      attributes: { artist_ids: ["catty-artist-id"] },
      user_alert_settings: {
        email: true,
        frequency: "daily",
        push: true,
      },
    })
  })
})
