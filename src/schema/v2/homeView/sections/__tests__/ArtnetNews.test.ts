import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("ArtnetNews", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-artnet-news") {
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
        "__typename": "HomeViewSectionArtnetNews",
        "component": {
          "behaviors": {
            "viewAll": {
              "buttonText": "More on artnet News",
              "href": "https://news.artnet.com",
            },
          },
          "title": "artnet News",
        },
        "contextModule": "marketNews",
        "internalID": "home-view-section-artnet-news",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-artnet-news") {
            ... on HomeViewSectionArtnetNews {
              artnetNewsArticlesConnection(first: 2) {
                edges {
                  node {
                    title
                    url
                  }
                }
              }
            }
          }
        }
      }
    `

    const posts = [
      {
        id: 1,
        title: "Auction Record Shattered",
        url: "https://news.artnet.com/market/auction-record-1",
      },
      {
        id: 2,
        title: "Museum Acquires Major Work",
        url: "https://news.artnet.com/art-world/museum-acquires-2",
      },
    ]

    const context = {
      artnetNewsArticlesLoader: jest.fn().mockResolvedValue({
        status: 200,
        data: { found_posts: 2, posts },
      }),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section.artnetNewsArticlesConnection.edges).toEqual([
      {
        node: {
          title: "Auction Record Shattered",
          url: "https://news.artnet.com/market/auction-record-1",
        },
      },
      {
        node: {
          title: "Museum Acquires Major Work",
          url: "https://news.artnet.com/art-world/museum-acquires-2",
        },
      },
    ])
  })
})
