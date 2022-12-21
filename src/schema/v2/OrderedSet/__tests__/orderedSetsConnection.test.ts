import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("orderedSetsConnection", () => {
  it("uses the match loader when searching by term", async () => {
    const matchSetsLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ description: "Foo fair" }, { description: "Foo bar fair" }],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        orderedSetsConnection(term: "foo", first: 5) {
          totalCount
          edges {
            node {
              description
            }
          }
        }
      }
    `
    const { orderedSetsConnection } = await runAuthenticatedQuery(query, {
      matchSetsLoader,
    })

    expect(matchSetsLoader).toBeCalledWith({
      term: "foo",
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(orderedSetsConnection.totalCount).toBe(2)
    expect(orderedSetsConnection.edges[0].node.description).toEqual("Foo fair")
    expect(orderedSetsConnection.edges[1].node.description).toEqual(
      "Foo bar fair"
    )
  })

  it("uses the sets loader when not searching by term", async () => {
    const setsLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [
          { description: "Foo feature" },
          { description: "Foo bar feature" },
        ],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        orderedSetsConnection(first: 5) {
          totalCount
          edges {
            node {
              description
            }
          }
        }
      }
    `
    const { orderedSetsConnection } = await runAuthenticatedQuery(query, {
      setsLoader,
    })

    expect(setsLoader).toBeCalledWith({
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(orderedSetsConnection.totalCount).toBe(2)
    expect(orderedSetsConnection.edges[0].node.description).toEqual(
      "Foo feature"
    )
    expect(orderedSetsConnection.edges[1].node.description).toEqual(
      "Foo bar feature"
    )
  })
})
