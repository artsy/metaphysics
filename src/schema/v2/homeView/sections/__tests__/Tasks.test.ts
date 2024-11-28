import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

jest.mock("lib/featureFlags", () => ({
  isFeatureFlagEnabled: jest.fn(() => true),
}))

describe("HomeViewSectionTasks", () => {
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
      {
        "__typename": "HomeViewSectionTasks",
        "component": {
          "behaviors": null,
          "description": null,
          "title": "Act Now",
        },
        "contextModule": "actNow",
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
      {
        "tasksConnection": {
          "edges": [
            {
              "node": {
                "title": "Task 1",
              },
            },
            {
              "node": {
                "title": "Task 2",
              },
            },
          ],
        },
      }
    `)
  })
})
