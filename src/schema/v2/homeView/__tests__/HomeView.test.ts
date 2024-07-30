import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("homeView", () => {
  const query = gql`
    {
      homeView {
        sectionsConnection(first: 2) {
          edges {
            node {
              ... on GenericHomeViewSection {
                component {
                  title
                }
              }
            }
          }
        }
      }
    }
  `

  const context = {
    authenticatedLoaders: {
      meLoader: jest.fn().mockReturnValue({ type: "User" }),
    },
  }

  it("returns a connection of home view sections", async () => {
    const { homeView } = await runQuery(query, context)

    expect(homeView.sectionsConnection.edges).toHaveLength(2)
  })

  it("returns requested data for each section", async () => {
    const { homeView } = await runQuery(query, context)

    expect(homeView.sectionsConnection).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "component": Object {
                "title": "New works for you",
              },
            },
          },
          Object {
            "node": Object {
              "component": Object {
                "title": "Auction lots for you",
              },
            },
          },
        ],
      }
    `)
  })
})
