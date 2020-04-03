import { runQuery } from "schema/v2/test/utils"

describe("HomePageFairsModule", () => {
  it("works", async () => {
    const liveSales = [
      {
        id: "the-greatest-sale-ever",
        name: "The Greatest Sale Ever",
      },
    ]

    const query = `
      {
        homePage {
          salesModule {
            results {
              slug
              name
            }
          }
        }
      }
    `

    const response = await runQuery(query, {
      salesLoader: () => Promise.resolve(liveSales),
    })
    const {
      homePage: {
        salesModule: { results },
      },
    } = response
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject(
      expect.objectContaining({ slug: "the-greatest-sale-ever" })
    )
  })
})
