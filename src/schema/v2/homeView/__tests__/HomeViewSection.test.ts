import { isFeatureFlagEnabled } from "lib/featureFlags"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("HomeViewSection", () => {
  describe("HomeViewSectionViewingRooms", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-viewing-rooms") {
              __typename
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

      const data = await runQuery(query, context)

      expect(data.homeView.section).toMatchInlineSnapshot(`
                Object {
                  "__typename": "HomeViewSectionViewingRooms",
                  "component": Object {
                    "behaviors": Object {
                      "viewAll": Object {
                        "buttonText": null,
                        "href": "/viewing-rooms",
                        "ownerType": "viewingRooms",
                      },
                    },
                    "title": "Viewing Rooms",
                  },
                }
            `)
    })
  })

  describe("HomeViewSectionTasks", () => {
    beforeAll(() => {
      mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
        if (flag === "emerald_home-view-tasks-section") return true
      })
    })

    const query = gql`
      {
        homeView {
          section(id: "home-view-section-tasks") {
            __typename
            component {
              title
            }

            ... on HomeViewSectionTasks {
              tasksConnection(first: 2) {
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

    it("returns correct data", async () => {
      const tasks = {
        body: [
          {
            title: "Task 1",
          },
          {
            title: "Task 2",
          },
        ],
        headers: { "x-total-count": 10 },
      }

      const context = {
        accessToken: "424242",
        meLoader: () => Promise.resolve({}),
        meTasksLoader: jest.fn().mockResolvedValue(tasks),
      }

      const { homeView } = await runQuery(query, context)

      expect(homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionTasks",
          "component": Object {
            "title": "Act Now",
          },
          "tasksConnection": Object {
            "edges": Array [
              Object {
                "node": Object {
                  "title": "Task 1",
                },
              },
              Object {
                "node": Object {
                  "title": "Task 2",
                },
              },
            ],
          },
        }
      `)
    })

    describe("when the feature flag is disabled", () => {
      beforeAll(() => {
        mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
          if (flag === "emerald_home-view-tasks-section") return false
        })
      })

      it("throws an error when accessed by id", async () => {
        const context = {
          fairsLoader: jest.fn().mockResolvedValue([]),
        }

        await expect(runQuery(query, context)).rejects.toThrow(
          "Section is not displayable: home-view-section-tasks"
        )
      })
    })
  })

  describe("GalleriesNearYou", () => {
    it("returns correct data", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-galleries-near-you") {
              __typename
              ownerType
              ... on HomeViewSectionCard {
                card {
                  title
                  subtitle
                  href
                  buttonText
                  image {
                    imageURL
                  }
                }
              }
            }
          }
        }
      `

      const context = {}

      const data = await runQuery(query, context)

      expect(data.homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionCard",
          "card": Object {
            "buttonText": "Explore",
            "href": null,
            "image": Object {
              "imageURL": "https://files.artsy.net/images/galleries_for_you.webp",
            },
            "subtitle": "Follow these local galleries for updates on artists you love.",
            "title": "Galleries near You",
          },
          "ownerType": "galleriesForYou",
        }
      `)
    })
  })

  describe("implements the NodeInterface", () => {
    it("returns the correct id", async () => {
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-news") {
              __typename
              id
            }
          }
        }
      `

      const context = {}

      const data = await runQuery(query, context)

      expect(data.homeView.section).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArticles",
          "id": "SG9tZVZpZXdTZWN0aW9uOmhvbWUtdmlldy1zZWN0aW9uLW5ld3M=",
        }
      `)
    })

    it("can query via the node interface", async () => {
      const query = gql`
        {
          node(id: "SG9tZVZpZXdTZWN0aW9uOmhvbWUtdmlldy1zZWN0aW9uLW5ld3M=") {
            __typename
            ... on HomeViewSectionGeneric {
              component {
                title
              }
            }
          }
        }
      `

      const context = {}

      const data = await runQuery(query, context)

      expect(data.node).toMatchInlineSnapshot(`
        Object {
          "__typename": "HomeViewSectionArticles",
          "component": Object {
            "title": "News",
          },
        }
      `)
    })
  })
})
