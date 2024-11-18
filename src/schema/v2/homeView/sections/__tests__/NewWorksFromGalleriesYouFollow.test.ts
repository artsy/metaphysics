import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("NewWorksFromGalleriesYouFollow", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-new-works-from-galleries-you-follow") {
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
          "behaviors": {
            "viewAll": {
              "buttonText": "Browse All Artworks",
              "href": null,
              "ownerType": null,
            },
          },
          "description": null,
          "title": "New Works from Galleries You Follow",
        },
        "contextModule": "newWorksByGalleriesYouFollowRail",
        "internalID": "home-view-section-new-works-from-galleries-you-follow",
        "ownerType": "newWorksFromGalleriesYouFollow",
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-new-works-from-galleries-you-follow") {
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

    const artworks = [
      { id: "percy", title: "Percy the Cat" },
      { id: "matt", title: "Matt the Person" },
      { id: "paul", title: "Paul the snail" },
      { id: "paula", title: "Paula the butterfly" },
    ]

    const context = {
      accessToken: "424242",
      followedProfilesArtworksLoader: jest
        .fn()
        .mockReturnValue({ body: artworks, headers: { "x-total-count": 2 } }),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "artworksConnection": {
          "edges": [
            {
              "node": {
                "id": "QXJ0d29yazpwZXJjeQ==",
                "title": "Percy the Cat",
              },
            },
            {
              "node": {
                "id": "QXJ0d29yazptYXR0",
                "title": "Matt the Person",
              },
            },
          ],
        },
      }
    `)
  })
})
