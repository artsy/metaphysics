import { runQuery } from "schema/v2/test/utils"
import gql from "lib/gql"

describe("MarketingCollections", () => {
  const query = gql`
    {
      marketingCollectionsConnection(first: 5) {
        totalCount
        edges {
          node {
            title
          }
        }
      }
    }
  `

  const marketingCollectionsLoader = jest.fn(() =>
    Promise.resolve({
      body: [
        {
          title: "Example Collection 1",
          description: "Example Description",
          category: "Blue Chip",
          artistIds: ["andy-warhol"],
        },
        {
          title: "Example Collection 2",
          description: "Example Description",
          category: "Blue Chip",
          artistIds: ["andy-warhol"],
        },
      ],
      headers: { "x-total-count": "2" },
    })
  )

  afterEach(() => {
    marketingCollectionsLoader.mockClear()
  })

  it("returns a connection", async () => {
    const { marketingCollectionsConnection } = await runQuery(query, {
      marketingCollectionsLoader,
    })

    expect(marketingCollectionsConnection.totalCount).toBe(2)
    expect(marketingCollectionsConnection.edges).toEqual([
      { node: { title: "Example Collection 1" } },
      { node: { title: "Example Collection 2" } },
    ])
  })
})
