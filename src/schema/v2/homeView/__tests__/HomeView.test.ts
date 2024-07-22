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
                key
                title
                component {
                  type
                }
              }
            }
          }
        }
      }
    }
  `

  it("returns a connection of home view sections", async () => {
    const { homeView } = await runQuery(query)

    expect(homeView.sectionsConnection.edges).toHaveLength(2)
  })

  it("returns requested data for each section", async () => {
    const { homeView } = await runQuery(query)

    expect(homeView.sectionsConnection).toMatchInlineSnapshot(`
      Object {
        "edges": Array [
          Object {
            "node": Object {
              "component": Object {
                "type": "ARTWORKS_RAIL",
              },
              "key": "RECENTLY_VIEWED_ARTWORKS",
              "title": "Recently viewed works",
            },
          },
          Object {
            "node": Object {
              "component": Object {
                "type": "ARTISTS_RAIL",
              },
              "key": "SUGGESTED_ARTISTS",
              "title": "Suggested artists for you",
            },
          },
        ],
      }
    `)
  })
})
