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

// The fixture has 15 published, curated guides (5 London, 2 each for New
// York and Paris, 1 each for Los Angeles, Berlin, Hong Kong, Tokyo, Milan
// and Mexico City) plus two unlisted personal itineraries owned by
// "user-42" (one in New York, one in LA).
const LONDON_CURATED_IDS = [
  "chill-vibes-only",
  "36-hours-in-london",
  "must-sees-and-hidden-gems",
  "peckham-and-deptford",
  "mayfair-in-an-afternoon",
]
const PARIS_CURATED_IDS = [
  "paris-marais-to-left-bank",
  "paris-right-bank-galleries",
]
const CURATED_IDS = [
  ...LONDON_CURATED_IDS,
  ...PARIS_CURATED_IDS,
  "chelsea-and-the-high-line",
  "lower-east-side-crawl",
  "la-arts-district-and-miracle-mile",
  "berlin-mitte-to-kreuzberg",
  "hong-kong-central-to-west-kowloon",
  "tokyo-roppongi-to-ginza",
  "milan-brera-and-porta-venezia",
  "mexico-city-roma-and-juarez",
]
const PERSONAL_ID = "7d4b1e5a-2c3d-4f6e-8a9b-0c1d2e3f4a5b"
const PERSONAL_IDS = [PERSONAL_ID, "8e5c2f6b-3d4e-5a7f-9b0c-1d2e3f4a5b6c"]

describe("itinerariesConnection (root field)", () => {
  const query = gql`
    {
      itinerariesConnection(first: 25) {
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

    expect(data.itinerariesConnection.totalCount).toEqual(15)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids.sort()).toEqual(CURATED_IDS.sort())
  })

  it("also includes the viewer's own itinerary, whatever its visibility", async () => {
    const data = await runAuthenticatedQuery(query, noItemsLoaders)

    expect(data.itinerariesConnection.totalCount).toEqual(17)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    CURATED_IDS.forEach((id) => expect(ids).toContain(id))
    PERSONAL_IDS.forEach((id) => expect(ids).toContain(id))
  })

  // The critical guarantee: a listing must never hand out someone else's
  // unlisted itinerary. The personal fixtures are unlisted and owned by
  // "user-42" — a *different* authenticated viewer must not see them.
  it("never returns another user's unlisted itinerary", async () => {
    const data = await runAuthenticatedQuery(query, {
      ...noItemsLoaders,
      userID: "someone-else",
    })

    expect(data.itinerariesConnection.totalCount).toEqual(15)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    PERSONAL_IDS.forEach((id) => expect(ids).not.toContain(id))
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

    expect(data.itinerariesConnection.totalCount).toEqual(2)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids.sort()).toEqual([...PERSONAL_IDS].sort())
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

    expect(data.itinerariesConnection.totalCount).toEqual(5)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids.sort()).toEqual(LONDON_CURATED_IDS.sort())
  })

  // The regression this fixture change guards against: before curated
  // guides existed for cities other than London, this returned an empty
  // page for every other city — the exact "empty screen" bug being fixed.
  it("returns curated results for a non-London city", async () => {
    const data = await runQuery(
      gql`
        {
          itinerariesConnection(
            first: 10
            citySlug: "paris-france"
            isCurated: true
          ) {
            totalCount
            edges {
              node {
                internalID
                citySlug
              }
            }
          }
        }
      `,
      {}
    )

    expect(data.itinerariesConnection.totalCount).toEqual(2)
    const parisIds = data.itinerariesConnection.edges.map(
      (e) => e.node.internalID
    )
    expect(parisIds.sort()).toEqual(PARIS_CURATED_IDS.sort())
    data.itinerariesConnection.edges.forEach((e) =>
      expect(e.node.citySlug).toEqual("paris-france")
    )
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

    expect(data.me.itinerariesConnection.totalCount).toEqual(2)
    const ids = data.me.itinerariesConnection.edges.map(
      (e) => e.node.internalID
    )
    expect(ids.sort()).toEqual([...PERSONAL_IDS].sort())
  })

  it("filters the viewer's own itineraries by citySlug", async () => {
    const data = await runAuthenticatedQuery(
      gql`
        {
          me {
            itinerariesConnection(first: 10, citySlug: "los-angeles-ca-usa") {
              totalCount
              edges {
                node {
                  internalID
                }
              }
            }
          }
        }
      `,
      noItemsLoaders
    )

    expect(data.me.itinerariesConnection.totalCount).toEqual(1)
    expect(data.me.itinerariesConnection.edges[0].node.internalID).toEqual(
      "8e5c2f6b-3d4e-5a7f-9b0c-1d2e3f4a5b6c"
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
