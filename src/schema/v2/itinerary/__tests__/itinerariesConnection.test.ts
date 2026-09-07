import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

describe("itinerariesConnection (root field)", () => {
  const query = gql`
    {
      itinerariesConnection(first: 10) {
        totalCount
        edges {
          node {
            internalID
          }
        }
      }
    }
  `

  it("returns only public itineraries when there is no viewer", async () => {
    const data = await runQuery(query)

    expect(data.itinerariesConnection.totalCount).toEqual(1)
    expect(data.itinerariesConnection.edges).toHaveLength(1)
    expect(data.itinerariesConnection.edges[0].node.internalID).toEqual(
      "3f6e9c2a-1b3d-4e2f-9c3a-1a2b3c4d5e6f"
    )
  })

  it("also includes the viewer's own itinerary, whatever its visibility", async () => {
    const data = await runAuthenticatedQuery(query, {})

    expect(data.itinerariesConnection.totalCount).toEqual(2)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids).toContain("3f6e9c2a-1b3d-4e2f-9c3a-1a2b3c4d5e6f")
    expect(ids).toContain("7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b")
  })

  // The critical guarantee: a listing must never hand out someone else's
  // unlisted itinerary. Fixture #2 is unlisted and owned by "user-42" — a
  // *different* authenticated viewer must not see it.
  it("never returns another user's unlisted itinerary", async () => {
    const data = await runAuthenticatedQuery(query, {
      userID: "someone-else",
    })

    expect(data.itinerariesConnection.totalCount).toEqual(1)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids).not.toContain("7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b")
  })

  it("filters by isCurated", async () => {
    const data = await runAuthenticatedQuery(
      gql`
        {
          itinerariesConnection(first: 10, isCurated: false) {
            totalCount
            edges {
              node {
                internalID
              }
            }
          }
        }
      `,
      {}
    )

    expect(data.itinerariesConnection.totalCount).toEqual(1)
    expect(data.itinerariesConnection.edges[0].node.internalID).toEqual(
      "7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b"
    )
  })

  it("filters by citySlug", async () => {
    const data = await runQuery(
      gql`
        {
          itinerariesConnection(first: 10, citySlug: "london-uk") {
            totalCount
            edges {
              node {
                internalID
              }
            }
          }
        }
      `,
      {}
    )

    expect(data.itinerariesConnection.totalCount).toEqual(1)
    expect(data.itinerariesConnection.edges[0].node.internalID).toEqual(
      "3f6e9c2a-1b3d-4e2f-9c3a-1a2b3c4d5e6f"
    )
  })
})

describe("Me.itinerariesConnection", () => {
  const query = gql`
    {
      me {
        itinerariesConnection(first: 10) {
          totalCount
          edges {
            node {
              internalID
            }
          }
        }
      }
    }
  `

  it("returns only the viewer's own itineraries, whatever their visibility", async () => {
    const data = await runAuthenticatedQuery(query, {})

    expect(data.me.itinerariesConnection.totalCount).toEqual(1)
    expect(data.me.itinerariesConnection.edges[0].node.internalID).toEqual(
      "7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b"
    )
  })

  it("does not return a public itinerary that isn't the viewer's own", async () => {
    const data = await runAuthenticatedQuery(query, {
      userID: "someone-else",
    })

    expect(data.me.itinerariesConnection.totalCount).toEqual(0)
    expect(data.me.itinerariesConnection.edges).toHaveLength(0)
  })
})
