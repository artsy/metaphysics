import { runQuery } from "schema/v2/test/utils"

describe("discoveryCategoriesConnection", () => {
  it("returns a connection of discovery categories", async () => {
    const query = `
      {
        discoveryCategoriesConnection(first: 10) {
          edges {
            node {
              title
              category
              imageUrl
            }
          }
        }
      }
    `

    const result = await runQuery(query)
    expect(result.discoveryCategoriesConnection).toBeDefined()
    expect(result.discoveryCategoriesConnection.edges).toHaveLength(6)

    const categories = result.discoveryCategoriesConnection.edges.map(
      (edge: any) => edge.node
    )

    expect(categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Medium",
          category: "Medium",
        }),
        expect.objectContaining({
          title: "Movement",
          category: "Movement",
        }),
        expect.objectContaining({
          title: "Size",
          category: "Collect by Size",
        }),
        expect.objectContaining({
          title: "Color",
          category: "Collect by Color",
        }),
        expect.objectContaining({
          title: "Price",
          category: "Collect by Price",
        }),
        expect.objectContaining({
          title: "Gallery",
          category: "Gallery",
        }),
      ])
    )
  })

  it("returns categories with images", async () => {
    const query = `
      {
        discoveryCategoriesConnection(first: 1) {
          edges {
            node {
              title
              imageUrl
            }
          }
        }
      }
    `

    const result = await runQuery(query)
    const firstCategory = result.discoveryCategoriesConnection.edges[0].node

    expect(firstCategory.imageUrl).toBeDefined()
    expect(firstCategory.imageUrl).toMatch(
      /^https:\/\/files\.artsy\.net\/images/
    )
  })

  it("supports pagination", async () => {
    const query = `
      {
        discoveryCategoriesConnection(first: 3) {
          edges {
            node {
              title
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }
    `

    const result = await runQuery(query)
    expect(result.discoveryCategoriesConnection.edges).toHaveLength(3)
    expect(result.discoveryCategoriesConnection.pageInfo.hasNextPage).toBe(true)
    expect(result.discoveryCategoriesConnection.pageInfo.hasPreviousPage).toBe(
      false
    )
  })
})
