import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

describe("BasedOnYourRecentSaves", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-based-on-your-recent-saves") {
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

    const context: any = {
      accessToken: "424242",
    }

    const response = await runQuery(query, context)

    expect(response.homeView).toMatchInlineSnapshot(`
      {
        "section": {
          "__typename": "HomeViewSectionArtworks",
          "component": {
            "behaviors": null,
            "description": null,
            "title": "Inspired by Your Saved Artworks",
          },
          "contextModule": "basedOnYourRecentSavesRail",
          "internalID": "home-view-section-based-on-your-recent-saves",
          "ownerType": "basedOnYourRecentSaves",
        },
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-based-on-your-recent-saves") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 2) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      }
    `

    const savedArtworksResponse = {
      body: [
        {
          _id: "saved-artwork-1",
          id: "artwork-1",
          slug: "artwork-1-slug",
        },
        {
          _id: "saved-artwork-2",
          id: "artwork-2",
          slug: "artwork-2-slug",
        },
        {
          _id: "saved-artwork-3",
          id: "artwork-3",
          slug: "artwork-3-slug",
        },
      ],
    }

    const similarArtworksResponse = [
      {
        _id: "similar-artwork-1",
        id: "similar-artwork-1",
        slug: "similar-artwork-1-slug",
      },
      {
        _id: "similar-artwork-2",
        id: "similar-artwork-2",
        slug: "similar-artwork-2-slug",
      },
    ]

    const savedArtworksLoader = jest.fn(async () => savedArtworksResponse)
    const similarArtworksLoader = jest.fn(async () => similarArtworksResponse)

    const context: any = {
      accessToken: "424242",
      savedArtworksLoader,
      similarArtworksLoader,
      userID: "user-id",
    }

    const response = await runQuery(query, context)

    expect(savedArtworksLoader).toHaveBeenCalledWith({
      size: 3,
      sort: "-position",
      user_id: "user-id",
      private: true,
    })

    expect(similarArtworksLoader).toHaveBeenCalledWith({
      artwork_id: ["saved-artwork-1", "saved-artwork-2", "saved-artwork-3"],
      for_sale: true,
      size: 2,
      offset: 0,
      total_count: true,
    })

    expect(response.homeView).toMatchInlineSnapshot(`
      {
        "section": {
          "artworksConnection": {
            "edges": [
              {
                "node": {
                  "id": "QXJ0d29yazpzaW1pbGFyLWFydHdvcmstMQ==",
                  "title": "Untitled",
                },
              },
              {
                "node": {
                  "id": "QXJ0d29yazpzaW1pbGFyLWFydHdvcmstMg==",
                  "title": "Untitled",
                },
              },
            ],
          },
        },
      }
    `)
  })

  it("returns null when user has no saved artworks", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-based-on-your-recent-saves") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 2) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      }
    `

    const savedArtworksResponse = {
      body: [],
    }

    const savedArtworksLoader = jest.fn(async () => savedArtworksResponse)
    const similarArtworksLoader = jest.fn()

    const context: any = {
      accessToken: "424242",
      savedArtworksLoader,
      similarArtworksLoader,
      userID: "user-id",
    }

    const response = await runQuery(query, context)

    expect(savedArtworksLoader).toHaveBeenCalledWith({
      size: 3,
      sort: "-position",
      user_id: "user-id",
      private: true,
    })

    expect(similarArtworksLoader).not.toHaveBeenCalled()
    expect(response.homeView).toMatchInlineSnapshot(`
      {
        "section": {
          "artworksConnection": null,
        },
      }
    `)
  })

  it("returns null when user is not available", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-based-on-your-recent-saves") {
            ... on HomeViewSectionArtworks {
              artworksConnection(first: 2) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        }
      }
    `

    const savedArtworksLoader = jest.fn()

    const context: any = {
      accessToken: "424242",
      savedArtworksLoader,
    }

    const response = await runQuery(query, context)

    expect(savedArtworksLoader).not.toHaveBeenCalled()
    expect(response.homeView).toMatchInlineSnapshot(`
      {
        "section": {
          "artworksConnection": null,
        },
      }
    `)
  })
})
