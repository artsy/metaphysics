import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("acticlesConnection", () => {
  const articlesLoader = jest.fn(() =>
    Promise.resolve({
      results: [{ title: "Foo Bar", vertical: { name: "Art Market" } }],
      count: 100,
    })
  )

  afterEach(() => {
    articlesLoader.mockClear()
  })

  it("returns data", async () => {
    const query = gql`
      {
        articlesConnection(
          first: 10
          sort: PUBLISHED_AT_DESC
          inEditorialFeed: true
        ) {
          totalCount
          edges {
            node {
              title
              vertical
            }
          }
        }
      }
    `

    const data = await runAuthenticatedQuery(query, { articlesLoader })

    expect(articlesLoader).toHaveBeenCalledWith({
      published: true,
      limit: 10,
      count: true,
      offset: 0,
      sort: "-published_at",
      in_editorial_feed: true,
    })

    expect(data).toEqual({
      articlesConnection: {
        totalCount: 100,
        edges: [
          {
            node: {
              title: "Foo Bar",
              vertical: "Art Market",
            },
          },
        ],
      },
    })
  })
})
