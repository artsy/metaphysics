import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("updateAlertMutation", () => {
  const mutation = gql`
    mutation {
      updateAlert(
        input: {
          id: "alert-id"
          artistIDs: ["catty-artist-id"]
          settings: { email: true, push: true, frequency: DAILY }
        }
      ) {
        responseOrError {
          __typename
          ... on UpdateAlertSuccess {
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

  const mockMeUpdateAlertLoader = jest.fn()

  const context = {
    meUpdateAlertLoader: mockMeUpdateAlertLoader,
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
    mockMeUpdateAlertLoader.mockResolvedValue(Promise.resolve(alert))
  })

  afterEach(() => {
    mockMeUpdateAlertLoader.mockReset()
  })

  it("returns an updated alert", async () => {
    const res = await runAuthenticatedQuery(mutation, context)

    expect(res).toMatchInlineSnapshot(`
      {
        "updateAlert": {
          "responseOrError": {
            "__typename": "UpdateAlertSuccess",
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

    const loaderArgs = mockMeUpdateAlertLoader.mock.calls[0]
    const id = loaderArgs[0]
    const params = loaderArgs[1]

    expect(id).toEqual("alert-id")
    expect(params).toMatchObject({
      attributes: { artist_ids: ["catty-artist-id"] },
      user_alert_settings: {
        email: true,
        frequency: "daily",
        push: true,
      },
    })
  })
})
