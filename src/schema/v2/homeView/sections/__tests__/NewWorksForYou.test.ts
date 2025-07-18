import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"
import "schema/v2/homeView/experiments/experiments"

jest.mock("lib/featureFlags", () => ({
  getExperimentVariant: jest.fn(),
}))

describe("NewWorksForYou", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-new-works-for-you") {
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
            ... on HomeViewSectionArtworks {
              trackItemImpressions
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
          "behaviors": {
            "viewAll": {
              "buttonText": "Browse All Artworks",
              "href": null,
              "ownerType": null,
            },
          },
          "description": null,
          "title": "New Works for You",
        },
        "contextModule": "newWorksForYouRail",
        "internalID": "home-view-section-new-works-for-you",
        "ownerType": "newWorksForYou",
        "trackItemImpressions": true,
      }
    `)
  })

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("returns the section's connection data", async () => {
    // see artworksForUser.test.ts
  })
})
