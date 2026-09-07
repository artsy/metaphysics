import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

// `resolveItinerariesConnection` calls `attachStopItems` on every itinerary
// it returns, regardless of whether `item` was actually requested -- that's
// what wires batching in unconditionally. `runAuthenticatedQuery` stubs
// every authenticated loader as a bare `jest.fn()` (resolves `undefined`)
// unless overridden, so any test whose itineraries carry stop items needs
// these stubbed with a well-shaped empty response.
const noItemsLoaders = {
  showsLoader: jest.fn().mockResolvedValue([]),
  partnersLoader: jest.fn().mockResolvedValue({ body: [], headers: {} }),
  fairsLoader: jest.fn().mockResolvedValue({ body: [], headers: {} }),
}

// The fixture has 3 published, curated London guides plus one unlisted
// personal itinerary owned by "user-42".
const CURATED_IDS = [
  "chill-vibes-only",
  "36-hours-in-london",
  "must-sees-and-hidden-gems",
]
const PERSONAL_ID = "7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b"

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

    expect(data.itinerariesConnection.totalCount).toEqual(3)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids.sort()).toEqual(CURATED_IDS.sort())
  })

  it("also includes the viewer's own itinerary, whatever its visibility", async () => {
    const data = await runAuthenticatedQuery(query, noItemsLoaders)

    expect(data.itinerariesConnection.totalCount).toEqual(4)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    CURATED_IDS.forEach((id) => expect(ids).toContain(id))
    expect(ids).toContain(PERSONAL_ID)
  })

  // The critical guarantee: a listing must never hand out someone else's
  // unlisted itinerary. The personal fixture is unlisted and owned by
  // "user-42" — a *different* authenticated viewer must not see it.
  it("never returns another user's unlisted itinerary", async () => {
    const data = await runAuthenticatedQuery(query, {
      ...noItemsLoaders,
      userID: "someone-else",
    })

    expect(data.itinerariesConnection.totalCount).toEqual(3)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids).not.toContain(PERSONAL_ID)
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
      noItemsLoaders
    )

    expect(data.itinerariesConnection.totalCount).toEqual(1)
    expect(data.itinerariesConnection.edges[0].node.internalID).toEqual(
      PERSONAL_ID
    )
  })

  it("filters by citySlug", async () => {
    const data = await runQuery(
      gql`
        {
          itinerariesConnection(first: 10, citySlug: "london-united-kingdom") {
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

    expect(data.itinerariesConnection.totalCount).toEqual(3)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids.sort()).toEqual(CURATED_IDS.sort())
  })

  it("wires attachStopItems in: a returned itinerary's stop item resolves via the batched loader", async () => {
    const partnersLoader = jest.fn().mockResolvedValue({
      body: [{ _id: "white-cube" }],
      headers: {},
    })

    // This would come back null on every stop if this connection's
    // resolver forgot to call `attachStopItems` on the page it returns.
    const data = await runAuthenticatedQuery(
      gql`
        {
          itinerariesConnection(first: 10) {
            edges {
              node {
                internalID
                sections {
                  stops {
                    item {
                      __typename
                      ... on Partner {
                        internalID
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      { ...noItemsLoaders, partnersLoader }
    )

    const mustSees = data.itinerariesConnection.edges.find(
      (e) => e.node.internalID === "must-sees-and-hidden-gems"
    )

    expect(mustSees.node.sections[0].stops[0].item).toEqual({
      __typename: "Partner",
      internalID: "white-cube",
    })
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
    const data = await runAuthenticatedQuery(query, noItemsLoaders)

    expect(data.me.itinerariesConnection.totalCount).toEqual(1)
    expect(data.me.itinerariesConnection.edges[0].node.internalID).toEqual(
      PERSONAL_ID
    )
  })

  it("does not return a public itinerary that isn't the viewer's own", async () => {
    const data = await runAuthenticatedQuery(query, {
      ...noItemsLoaders,
      userID: "someone-else",
    })

    expect(data.me.itinerariesConnection.totalCount).toEqual(0)
    expect(data.me.itinerariesConnection.edges).toHaveLength(0)
  })

  it("wires attachStopItems in: a returned itinerary's stop item resolves via the batched loader", async () => {
    const fairsLoader = jest.fn().mockResolvedValue({
      body: [{ _id: "000000000000000000000002" }],
      headers: {},
    })

    const data = await runAuthenticatedQuery(
      gql`
        {
          me {
            itinerariesConnection(first: 10) {
              edges {
                node {
                  sections {
                    stops {
                      item {
                        __typename
                        ... on Fair {
                          internalID
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      { ...noItemsLoaders, fairsLoader }
    )

    expect(
      data.me.itinerariesConnection.edges[0].node.sections[0].stops[0].item
    ).toEqual({
      __typename: "Fair",
      internalID: "000000000000000000000002",
    })
  })
})
