import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { ResolverContext } from "types/graphql"

describe("ActiveBids", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-active-bids") {
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
        "__typename": "HomeViewSectionArtworks",
        "component": {
          "behaviors": null,
          "description": null,
          "title": "Your Active Bids",
        },
        "contextModule": "yourActiveBids",
        "internalID": "home-view-section-active-bids",
        "ownerType": null,
      }
    `)
  })

  it("requires an authenticated user", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-active-bids") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 10) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `

    const context: Partial<ResolverContext> = { accessToken: undefined }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section.artworksConnection).toBeNull()
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-active-bids") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 2) {
                edges {
                  node {
                    title
                  }
                }
              }
            }
          }
        }
      }
    `

    const lots = [
      {
        sale_artwork: {
          artwork: {
            title: "Artwork 1",
          },
        },
      },
      {
        sale_artwork: {
          artwork: {
            title: "Artwork 2",
          },
        },
      },
    ]

    const context = {
      accessToken: "424242",
      lotStandingLoader: jest.fn().mockResolvedValue(lots),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "artworksConnection": {
          "edges": [
            {
              "node": {
                "title": "Artwork 1",
              },
            },
            {
              "node": {
                "title": "Artwork 2",
              },
            },
          ],
        },
      }
    `)
  })
})
