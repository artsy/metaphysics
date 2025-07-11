import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import { isSectionDisplayable } from "schema/v2/homeView/helpers/isSectionDisplayable"
import { DiscoverSomethingNew } from "../DiscoverSomethingNew"

describe("DiscoverSomethingNew", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-discover-something-new") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
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

    const context = {}

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
        {
          "__typename": "HomeViewSectionCards",
          "component": {
            "behaviors": null,
            "title": "Discover Something New",
          },
          "contextModule": "discoverSomethingNewRail",
          "internalID": "home-view-section-discover-something-new",
          "ownerType": null,
        }
      `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-discover-something-new") {
            ... on HomeViewSectionCards {
              cardsConnection(first: 6) {
                edges {
                  node {
                    entityID
                    title
                    image {
                      url
                    }
                  }
                }
              }
            }
          }
        }
      }
    `

    const context = {
      marketingCollectionsLoader: jest.fn().mockResolvedValue({
        body: [
          {
            slug: "figurative-art",
            id: "figurative-art",
            title: "Figurative Art",
            subtitle: "Our Picks",
            thumbnail: "figurative-art.jpg",
          },
          {
            slug: "new-from-leading-galleries",
            id: "new-from-leading-galleries",
            title: "New from Leading Galleries",
            subtitle: "Our Picks",
            thumbnail: "new-from-leading-galleries.jpg",
          },
        ],
      }),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
        {
          "cardsConnection": {
            "edges": [
              {
                "node": {
                  "entityID": "figurative-art",
                  "image": {
                    "url": "figurative-art.jpg",
                  },
                  "title": "Figurative Art",
                },
              },
              {
                "node": {
                  "entityID": "new-from-leading-galleries",
                  "image": {
                    "url": "new-from-leading-galleries.jpg",
                  },
                  "title": "New from Leading Galleries",
                },
              },
            ],
          },
        }
      `)
  })

  describe("eigen version constraints", () => {
    it("is displayable when user is on version 8.77.0 (at maximum)", () => {
      const context = {
        userAgent:
          "unknown iOS/18.1.1 Artsy-Mobile/8.77.0 Eigen/2024.12.10.06/8.77.0",
      } as any
      expect(isSectionDisplayable(DiscoverSomethingNew, context)).toBe(true)
    })

    it("is displayable when user is on version 8.76.0 (below maximum)", () => {
      const context = {
        userAgent:
          "unknown iOS/18.1.1 Artsy-Mobile/8.76.0 Eigen/2024.12.10.06/8.76.0",
      } as any
      expect(isSectionDisplayable(DiscoverSomethingNew, context)).toBe(true)
    })

    it("is not displayable when user is on version 8.78.0 (above maximum)", () => {
      const context = {
        userAgent:
          "unknown iOS/18.1.1 Artsy-Mobile/8.78.0 Eigen/2024.12.10.06/8.78.0",
      } as any
      expect(isSectionDisplayable(DiscoverSomethingNew, context)).toBe(false)
    })

    it("is not displayable when user is on version 9.0.0 (above maximum)", () => {
      const context = {
        userAgent:
          "unknown iOS/18.1.1 Artsy-Mobile/9.0.0 Eigen/2024.12.10.06/9.0.0",
      } as any
      expect(isSectionDisplayable(DiscoverSomethingNew, context)).toBe(false)
    })

    it("is displayable when user agent is unrecognized (graceful fallback)", () => {
      const context = {
        userAgent: "unknown browser",
      } as any
      expect(isSectionDisplayable(DiscoverSomethingNew, context)).toBe(true)
    })
  })
})
