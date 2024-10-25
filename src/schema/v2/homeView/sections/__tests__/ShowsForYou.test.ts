import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("ShowsForYou", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-shows-for-you") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
              description
              behaviors {
                viewAll {
                  buttonText
                  href
                  ownerType
                }
              }
            }
          }
        }
      }
    `

    const context = {
      accessToken: "424242",
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "__typename": "HomeViewSectionShows",
        "component": {
          "behaviors": null,
          "description": null,
          "title": "Shows for You",
        },
        "contextModule": "showsRail",
        "internalID": "home-view-section-shows-for-you",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-shows-for-you") {
            ... on HomeViewSectionShows {
              showsConnection(first: 3) {
                edges {
                  node {
                    slug
                    name
                    location {
                      city
                      coordinates {
                        lat
                        lng
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const showsResponse = {
      headers: {
        "x-total-count": 2,
      },
      body: [
        {
          id: "gallery-one-a-nice-show",
          name: "A nice show",
          location: {
            city: "New York",
            coordinates: { lng: -74.0027, lat: 40.2854 },
          },
        },
        {
          id: "gallery-two-another-nice-show",
          name: "Another nice show",
          location: {
            city: "New York",
            coordinates: { lng: -73.4105, lat: 40.2535 },
          },
        },
      ],
    }

    const meShowsLoader = jest.fn(async () => showsResponse)

    const context: any = {
      accessToken: "424242",
      meShowsLoader,
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "showsConnection": {
          "edges": [
            {
              "node": {
                "location": {
                  "city": "New York",
                  "coordinates": {
                    "lat": 40.2854,
                    "lng": -74.0027,
                  },
                },
                "name": "A nice show",
                "slug": "gallery-one-a-nice-show",
              },
            },
            {
              "node": {
                "location": {
                  "city": "New York",
                  "coordinates": {
                    "lat": 40.2535,
                    "lng": -73.4105,
                  },
                },
                "name": "Another nice show",
                "slug": "gallery-two-another-nice-show",
              },
            },
          ],
        },
      }
    `)
  })

  it("handles a `near` argument", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-shows-for-you") {
            ... on HomeViewSectionShows {
              showsConnection(first: 3, near: { lat: 40.7, lng: -74 }) {
                edges {
                  node {
                    slug
                  }
                }
              }
            }
          }
        }
      }
    `

    const showsResponse = {
      headers: {
        "x-total-count": 0,
      },
      body: [],
    }

    const meShowsLoader = jest.fn(async () => showsResponse)

    const context: any = {
      accessToken: "424242",
      meShowsLoader,
    }

    await runQuery(query, context)

    expect(meShowsLoader).toHaveBeenCalledWith(
      expect.objectContaining({ near: "40.7,-74" })
    )
  })
})
