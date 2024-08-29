import { runQuery } from "schema/v2/test/utils"

describe("HomePageMarketingCollectionsModule", () => {
  it("returns marketing collections", async () => {
    const marketingCollections = [
      {
        slug: "the-second-greatest-collection-ever",
        title: "The Second Greatest Colletion Ever",
      },
      {
        slug: "the-greatest-collection-ever",
        title: "The Greatest Collection Ever",
      },
    ]

    const query = `
      {
        homePage {
          marketingCollectionsModule {
            results {
              slug
              title
            }
          }
        }
      }
    `

    const data = await runQuery(query, {
      marketingCollectionsLoader: () =>
        Promise.resolve({ body: marketingCollections }),
    })

    const {
      homePage: {
        marketingCollectionsModule: { results },
      },
    } = data

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject(
      expect.objectContaining({ slug: "the-second-greatest-collection-ever" })
    )
  })
})
