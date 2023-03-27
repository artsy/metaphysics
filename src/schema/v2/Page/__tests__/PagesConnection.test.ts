import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("PagesConnection", () => {
  it("uses the matchPagesLoader when searching by term", async () => {
    const matchPagesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ name: "Foo fair" }, { name: "Foo bar fair" }],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        pagesConnection(term: "foo", first: 5) {
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `
    const { pagesConnection } = await runAuthenticatedQuery(query, {
      matchPagesLoader,
    })

    expect(matchPagesLoader).toBeCalledWith({
      term: "foo",
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(pagesConnection.totalCount).toBe(2)
    expect(pagesConnection.edges[0].node.name).toEqual("Foo fair")
    expect(pagesConnection.edges[1].node.name).toEqual("Foo bar fair")
  })

  it("uses the pagesLoader when not searching by term", async () => {
    const pagesLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ name: "Foo feature" }, { name: "Foo bar feature" }],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        pagesConnection(first: 5) {
          totalCount
          edges {
            node {
              name
            }
          }
        }
      }
    `
    const { pagesConnection } = await runAuthenticatedQuery(query, {
      pagesLoader,
    })

    expect(pagesLoader).toBeCalledWith({
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(pagesConnection.totalCount).toBe(2)
    expect(pagesConnection.edges[0].node.name).toEqual("Foo feature")
    expect(pagesConnection.edges[1].node.name).toEqual("Foo bar feature")
  })
})
