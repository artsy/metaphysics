import gql from "lib/gql"
import { runQuery } from "../test/utils"

const marketingCategoriesData = [
  {
    name: "Contemporary",
    collections: [
      {
        id: "percys-z-collection-1",
        slug: "percys-z-collection-1",
        title: "Percy Z Collection",
      },
      {
        id: "fiby-z-collection-2",
        slug: "fiby-z-collection-2",
        title: "Fiby Z Collection 2",
      },
    ],
  },
  {
    name: "Impressionism",
    collections: [
      {
        id: "fiby-z-collection-2",
        slug: "fiby-z-collection-2",
        title: "Fiby Z Collection 2",
      },
    ],
  },
]

describe("MarketingCategories", () => {
  it("returns a list of marketing categories", async () => {
    const query = gql`
      {
        marketingCategories {
          name
          collections {
            slug
            title
          }
        }
      }
    `
    const context = {
      marketingCategoriesLoader: () => Promise.resolve(marketingCategoriesData),
    } as any

    const data = await runQuery(query, context)

    expect(data).toEqual({
      marketingCategories: [
        {
          name: "Contemporary",
          collections: [
            {
              slug: "percys-z-collection-1",
              title: "Percy Z Collection",
            },
            {
              slug: "fiby-z-collection-2",
              title: "Fiby Z Collection 2",
            },
          ],
        },
        {
          name: "Impressionism",
          collections: [
            {
              slug: "fiby-z-collection-2",
              title: "Fiby Z Collection 2",
            },
          ],
        },
      ],
    })
  })
})
