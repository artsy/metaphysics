import gql from "lib/gql"
import { runQuery } from "schema/v2/test/utils"

describe("HomeViewSection", () => {
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
        {
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
        {
          "__typename": "HomeViewSectionArticles",
          "component": {
            "title": "News",
          },
        }
      `)
    })
  })
})
