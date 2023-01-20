import gql from "lib/gql"
import { runAuthenticatedQuery } from "schema/v2/test/utils"

describe("featuredLinksConnection", () => {
  it("uses the match loader when searching by term", async () => {
    const matchFeaturedLinksLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ href: "/bitty" }, { href: "/percy" }],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        featuredLinksConnection(term: "foo", first: 5) {
          totalCount
          edges {
            node {
              href
            }
          }
        }
      }
    `
    const { featuredLinksConnection } = await runAuthenticatedQuery(query, {
      matchFeaturedLinksLoader,
    })

    expect(matchFeaturedLinksLoader).toBeCalledWith({
      term: "foo",
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(featuredLinksConnection.totalCount).toBe(2)
    expect(featuredLinksConnection.edges[0].node.href).toEqual("/bitty")
    expect(featuredLinksConnection.edges[1].node.href).toEqual("/percy")
  })

  it("uses the features loader when not searching by term", async () => {
    const featuredLinksLoader = jest.fn().mockReturnValue(
      Promise.resolve({
        body: [{ href: "/bitty" }, { href: "/percy" }],
        headers: { "x-total-count": "2" },
      })
    )

    const query = gql`
      {
        featuredLinksConnection(first: 5) {
          totalCount
          edges {
            node {
              href
            }
          }
        }
      }
    `
    const { featuredLinksConnection } = await runAuthenticatedQuery(query, {
      featuredLinksLoader,
    })

    expect(featuredLinksLoader).toBeCalledWith({
      page: 1,
      size: 5,
      total_count: true,
    })

    expect(featuredLinksConnection.totalCount).toBe(2)
    expect(featuredLinksConnection.edges[0].node.href).toEqual("/bitty")
    expect(featuredLinksConnection.edges[1].node.href).toEqual("/percy")
  })
})
