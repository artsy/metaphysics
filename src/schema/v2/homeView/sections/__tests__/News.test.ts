import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("News", () => {
  it("returns the section's metadata", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-news") {
            __typename
            internalID
            contextModule
            ownerType
            component {
              title
              type
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
      Object {
        "__typename": "HomeViewSectionArticles",
        "component": Object {
          "behaviors": Object {
            "viewAll": Object {
              "buttonText": "More in News",
              "href": "/news",
              "ownerType": "marketNews",
            },
          },
          "title": "News",
          "type": "ArticlesCard",
        },
        "contextModule": "marketNews",
        "internalID": "home-view-section-news",
        "ownerType": null,
      }
    `)
  })

  it("returns the section's connection data", async () => {
    const query = gql`
      {
        homeView {
          section(id: "home-view-section-news") {
            ... on HomeViewSectionArticles {
              articlesConnection(first: 3) {
                edges {
                  node {
                    title
                    href
                  }
                }
              }
            }
          }
        }
      }
    `

    const articles = [
      {
        title: "Bored apes stolen",
        slug: "stolen-apes",
      },
      {
        title: "More apes stolen",
        slug: "more-apes",
      },
    ]

    const context = {
      articlesLoader: jest.fn().mockReturnValue({
        count: articles.length,
        results: articles,
      }),
    }

    const { homeView } = await runQuery(query, context)

    expect(homeView.section).toMatchInlineSnapshot(`
      Object {
        "articlesConnection": Object {
          "edges": Array [
            Object {
              "node": Object {
                "href": "/article/stolen-apes",
                "title": "Bored apes stolen",
              },
            },
            Object {
              "node": Object {
                "href": "/article/more-apes",
                "title": "More apes stolen",
              },
            },
          ],
        },
      }
    `)
  })
})
