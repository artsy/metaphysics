import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("GalleriesNearYou", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-galleries-near-you") {
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
        "__typename": "HomeViewSectionCard",
        "component": {
          "behaviors": null,
          "description": "Follow these local galleries for updates on artists you love.",
          "title": "Galleries near You",
        },
        "contextModule": "galleriesForYouBanner",
        "internalID": "home-view-section-galleries-near-you",
        "ownerType": "galleriesForYou",
      }
    `)
  })

  it("returns the section's card data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-galleries-near-you") {
            ... on HomeViewSectionCard {
              card {
                title
                subtitle
                href
                image {
                  imageURL
                }
                entityType
                entityID
              }
            }
          }
        }
      }
    `

    const context: any = {}

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      {
        "card": {
          "entityID": "galleriesForYou",
          "entityType": "Page",
          "href": null,
          "image": {
            "imageURL": "https://files.artsy.net/images/galleries_for_you.webp",
          },
          "subtitle": "Follow these local galleries for updates on artists you love.",
          "title": "Galleries near You",
        },
      }
    `)
  })
})
