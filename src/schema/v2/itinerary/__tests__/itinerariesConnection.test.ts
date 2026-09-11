import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

// Which itineraries a listing may contain is Gravity's decision — its
// predicate is "published, or the caller's own". Metaphysics used to
// re-implement that over fixture data; it no longer does, so these tests
// assert what Metaphysics is actually still responsible for: passing the
// right arguments through, and mapping what comes back.

const itinerary = (id: string, overrides = {}) => ({
  id,
  slug: id,
  user_id: "user-42",
  city_slug: "london-united-kingdom",
  title: `Guide ${id}`,
  subtitle: null,
  description: null,
  author_name: "Casey Lesser",
  is_curated: true,
  visibility: "public",
  published_at: "2026-08-01T09:00:00Z",
  published_by_id: null,
  share_token: null,
  sections_count: 0,
  image_url: null,
  image_urls: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  sections: [],
  ...overrides,
})

const loadersReturning = (body: any[], totalCount = body.length) => ({
  itinerariesLoader: jest.fn().mockResolvedValue({
    body,
    headers: { "x-total-count": String(totalCount) },
  }),
  showsLoader: jest.fn().mockResolvedValue([]),
  partnerLocationByIdLoader: jest.fn().mockResolvedValue(null),
  fairsLoader: jest.fn().mockResolvedValue({ body: [], headers: {} }),
})

const query = gql`
  {
    itinerariesConnection(first: 10) {
      totalCount
      edges {
        node {
          internalID
          title
        }
      }
    }
  }
`

describe("itinerariesConnection (root field)", () => {
  it("maps Gravity's page onto the connection", async () => {
    const context = loadersReturning([itinerary("a"), itinerary("b")], 7)

    const data = await runQuery(query, context)

    expect(data.itinerariesConnection.totalCount).toEqual(7)
    const ids = data.itinerariesConnection.edges.map((e) => e.node.internalID)
    expect(ids).toEqual(["a", "b"])
    expect(data.itinerariesConnection.edges[0].node.title).toEqual("Guide a")
  })

  it("asks Gravity for a total count, so the connection can report one", async () => {
    const context = loadersReturning([])

    await runQuery(query, context)

    expect(context.itinerariesLoader).toHaveBeenCalledWith(
      expect.objectContaining({ total_count: true })
    )
  })

  it("passes citySlug and isCurated through as Gravity's own filters", async () => {
    const context = loadersReturning([])

    await runQuery(
      gql`
        {
          itinerariesConnection(
            first: 10
            citySlug: "london-united-kingdom"
            isCurated: true
          ) {
            totalCount
          }
        }
      `,
      context
    )

    expect(context.itinerariesLoader).toHaveBeenCalledWith(
      expect.objectContaining({
        city_slug: "london-united-kingdom",
        is_curated: true,
      })
    )
  })

  // `isCurated: false` is a real filter — personal itineraries only — and
  // must not be dropped the way an absent argument is.
  it("passes isCurated: false rather than omitting it", async () => {
    const context = loadersReturning([])

    await runQuery(
      gql`
        {
          itinerariesConnection(first: 10, isCurated: false) {
            totalCount
          }
        }
      `,
      context
    )

    expect(context.itinerariesLoader).toHaveBeenCalledWith(
      expect.objectContaining({ is_curated: false })
    )
  })

  it("sends no owner filter on the root field", async () => {
    const context = loadersReturning([])

    await runAuthenticatedQuery(query, context)

    expect(context.itinerariesLoader).toHaveBeenCalledWith(
      expect.not.objectContaining({ user_id: expect.anything() })
    )
  })

  it("wires attachStopItems in: a returned stop's item resolves", async () => {
    const withStop = itinerary("a", {
      sections_count: 1,
      sections: [
        {
          id: "s1",
          itinerary_id: "a",
          title: null,
          note: null,
          position: 0,
          stops_count: 1,
          created_at: "2026-08-01T09:00:00Z",
          updated_at: "2026-08-01T09:00:00Z",
          stops: [
            {
              id: "stop-1",
              itinerary_section_id: "s1",
              position: 0,
              item_type: "PartnerShow",
              item_id: "show-1",
              event_type: null,
              event_id: null,
              title: null,
              address: null,
              image_url: null,
              latitude: null,
              longitude: null,
              start_at: null,
              end_at: null,
              time_zone: null,
              note: null,
              category: null,
              is_free_admission: null,
              source_url: null,
              created_at: "2026-08-01T09:00:00Z",
              updated_at: "2026-08-01T09:00:00Z",
            },
          ],
        },
      ],
    })

    const context = {
      ...loadersReturning([withStop]),
      showsLoader: jest.fn().mockResolvedValue([{ _id: "show-1" }]),
    }

    // This comes back null on every stop if the connection's resolver
    // forgets to call `attachStopItems` on the page it returns.
    const data = await runAuthenticatedQuery(
      gql`
        {
          itinerariesConnection(first: 10) {
            edges {
              node {
                sections {
                  stops {
                    item {
                      __typename
                    }
                  }
                }
              }
            }
          }
        }
      `,
      context
    )

    expect(
      data.itinerariesConnection.edges[0].node.sections[0].stops[0].item
        .__typename
    ).toEqual("Show")
  })
})

describe("Me.itinerariesConnection", () => {
  const meQuery = gql`
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

  // The difference between this and the root field: Gravity is asked for
  // exactly one owner's itineraries, of any visibility. Without the
  // user_id, this would return every public guide as though it were the
  // viewer's own.
  it("restricts the listing to the viewer by passing their user_id", async () => {
    const context = {
      ...loadersReturning([itinerary("mine", { is_curated: false })]),
      meLoader: jest.fn().mockResolvedValue({ id: "user-42" }),
    }

    const data = await runAuthenticatedQuery(meQuery, context)

    expect(context.itinerariesLoader).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-42" })
    )
    expect(data.me.itinerariesConnection.edges[0].node.internalID).toEqual(
      "mine"
    )
  })
})
