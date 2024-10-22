import { isFeatureFlagEnabled } from "lib/featureFlags"
import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.Mock

describe("HomeViewSectionTasks", () => {
  beforeAll(() => {
    mockIsFeatureFlagEnabled.mockImplementation((flag: string) => {
      if (flag === "emerald_home-view-tasks-section") return true
    })
  })

  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-tasks") {
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
          "behaviors": null,
          "description": null,
          "title": "Act Now",
        },
        "contextModule": null,
        "internalID": "home-view-section-tasks",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-tasks") {
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
      const query = gql`
        {
          homeView {
            section(id: "home-view-section-tasks") {
              __typename
              component {
                title
              }
            }
          }
        }
      `

      const context = {}

      await expect(runQuery(query, context)).rejects.toThrow(
        "Section is not displayable: home-view-section-tasks"
      )
    })
  })
})
