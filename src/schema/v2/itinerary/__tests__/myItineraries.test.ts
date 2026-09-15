import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"

/** A stop as Gravity sends it inside an itinerary. */
const stop = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  itinerary_section_id: "section-1",
  position: 0,
  item_type: "PartnerShow",
  item_id: "show-1",
  event_type: null,
  event_id: null,
  title: null,
  address: null,
  image_url: null,
  image_urls: null,
  latitude: null,
  longitude: null,
  start_at: null,
  end_at: null,
  time_zone: null,
  note: null,
  category: null,
  is_free_admission: null,
  source_url: null,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
  ...overrides,
})

/** A personal itinerary as `GET /api/v1/itinerary/:id` sends it. */
const mineNamed = (id: string, title: string) => ({
  id,
  slug: null,
  user_id: "user-1",
  city_slug: "london-united-kingdom",
  title,
  subtitle: null,
  description: null,
  author_name: null,
  is_curated: false,
  visibility: "private",
  published_at: null,
  published_by_id: null,
  share_token: null,
  sections_count: 0,
  image_url: null,
  image_urls: null,
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
  sections: [],
})

/** The same shape from `GET /api/v1/itinerary_stops`, which also selects the itinerary. */
const myStop = (id: string, itineraryID: string, overrides = {}) => ({
  ...stop(id, overrides),
  itinerary_id: itineraryID,
})

const guide = (stops: Record<string, unknown>[]) => ({
  id: "guide-1",
  slug: "chill-vibes-only",
  user_id: "editor-1",
  city_slug: "london-united-kingdom",
  title: "Chill Vibes Only",
  subtitle: null,
  description: null,
  author_name: "Casey Lesser",
  is_curated: true,
  visibility: "public",
  published_at: "2026-08-01T09:00:00Z",
  published_by_id: "editor-1",
  share_token: null,
  sections_count: 1,
  image_url: null,
  image_urls: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  sections: [
    {
      id: "section-1",
      itinerary_id: "guide-1",
      position: 0,
      title: "Day 1",
      note: null,
      stops_count: stops.length,
      stops,
      created_at: "2026-08-01T09:00:00Z",
      updated_at: "2026-08-01T09:00:00Z",
    },
  ],
})

const query = gql`
  {
    itinerary(id: "chill-vibes-only") {
      sections {
        stops {
          internalID
          isOnMyItinerary
          myItineraries {
            internalID
            title
          }
        }
      }
    }
  }
`

const context = (
  mine: Record<string, unknown>[],
  itinerary: Record<string, unknown>,
  myItineraries: Record<string, unknown>[] = [
    mineNamed("itin-1", "London October 2026"),
  ]
) => ({
  // The guide by slug, and the caller's own by id.
  itineraryLoader: jest.fn((id: string) =>
    Promise.resolve(myItineraries.find((each) => each.id === id) ?? itinerary)
  ),
  itineraryStopsLoader: jest.fn().mockResolvedValue(mine),
  showsLoader: jest.fn().mockResolvedValue([]),
  partnerLocationByIdLoader: jest.fn().mockResolvedValue(null),
  fairsLoader: jest.fn().mockResolvedValue({ body: [], headers: {} }),
})

const stopsFrom = (data: any) => data.itinerary.sections[0].stops

describe("ItineraryStop.myItineraries", () => {
  it("names the caller's itinerary holding the same entity", async () => {
    const data = await runAuthenticatedQuery(
      query,
      context([myStop("mine-1", "itin-1")], guide([stop("guide-stop-1")]))
    )

    expect(stopsFrom(data)[0].myItineraries).toEqual([
      { internalID: "itin-1", title: "London October 2026" },
    ])
    expect(stopsFrom(data)[0].isOnMyItinerary).toBe(true)
  })

  // Non-empty is the "already on one of mine?" answer, so empty has to mean not added.
  it("is empty when the caller has not added the entity", async () => {
    const data = await runAuthenticatedQuery(
      query,
      context(
        [myStop("mine-1", "itin-1", { item_id: "show-9" })],
        guide([stop("guide-stop-1")])
      )
    )

    expect(stopsFrom(data)[0].myItineraries).toEqual([])
    expect(stopsFrom(data)[0].isOnMyItinerary).toBe(false)
  })

  // An id on its own matches a different entity of another type.
  it("does not match the same id under another item type", async () => {
    const data = await runAuthenticatedQuery(
      query,
      context(
        [myStop("mine-1", "itin-1", { item_type: "Fair" })],
        guide([stop("guide-stop-1")])
      )
    )

    expect(stopsFrom(data)[0].myItineraries).toEqual([])
  })

  it("names every itinerary holding the entity", async () => {
    const data = await runAuthenticatedQuery(
      query,
      context(
        [myStop("mine-1", "itin-1"), myStop("mine-2", "itin-2")],
        guide([stop("guide-stop-1")]),
        [mineNamed("itin-1", "First trip"), mineNamed("itin-2", "Second trip")]
      )
    )

    expect(stopsFrom(data)[0].myItineraries).toEqual([
      { internalID: "itin-1", title: "First trip" },
      { internalID: "itin-2", title: "Second trip" },
    ])
  })

  // A custom stop points at no entity, so there is nothing to match it against.
  it("is empty for a custom stop", async () => {
    const data = await runAuthenticatedQuery(
      query,
      context(
        [myStop("mine-1", "itin-1")],
        guide([stop("cafe", { item_type: null, item_id: null, title: "Cafe" })])
      )
    )

    expect(stopsFrom(data)[0].myItineraries).toEqual([])
    expect(stopsFrom(data)[0].isOnMyItinerary).toBe(false)
  })

  it("matches each stop of a guide to the caller's own", async () => {
    const data = await runAuthenticatedQuery(
      query,
      context(
        [myStop("mine-1", "itin-1", { item_id: "show-2" })],
        guide([
          stop("guide-stop-1", { item_id: "show-1" }),
          stop("guide-stop-2", { item_id: "show-2" }),
        ])
      )
    )

    expect(stopsFrom(data)[0].myItineraries).toEqual([])
    expect(stopsFrom(data)[1].myItineraries).toEqual([
      { internalID: "itin-1", title: "London October 2026" },
    ])
  })

  /*
    The N+1 guard, and the reason the field asks by city rather than by entity. A guide with
    several stops resolves this field once per stop; what keeps that to one HTTP call is that
    every call carries identical params, which the loader caches on
    (loader_with_authentication_factory.ts:87-89, `cache: !isMutatingMethod`). A jest.fn() does
    no caching, so this asserts the property that makes the cache work rather than the count.
  */
  it("asks for the same city for every stop, so the loader's cache collapses it", async () => {
    const ctx = context(
      [myStop("mine-1", "itin-1")],
      guide([
        stop("guide-stop-1", { item_id: "show-1" }),
        stop("guide-stop-2", { item_id: "show-2" }),
        stop("guide-stop-3", { item_id: "show-3" }),
        stop("guide-stop-4", { item_id: "show-4" }),
      ])
    )

    const data = await runAuthenticatedQuery(query, ctx)

    expect(stopsFrom(data)).toHaveLength(4)

    const keys = ctx.itineraryStopsLoader.mock.calls.map(([params]) =>
      JSON.stringify(params)
    )

    expect(new Set(keys).size).toBe(1)
    expect(JSON.parse(keys[0])).toEqual({ city_slug: "london-united-kingdom" })
  })

  /*
    The second request's guard. Itineraries are fetched by id, and the ids asked for are the
    ones actually holding the entity — not one per stop. `itineraryLoader` caches per id, so a
    guide whose stops sit on the same itinerary of mine fetches it once.
  */
  it("asks for each holding itinerary once, however many stops point at it", async () => {
    const ctx = context(
      [
        myStop("mine-1", "itin-1", { item_id: "show-1" }),
        myStop("mine-2", "itin-1", { item_id: "show-2" }),
        myStop("mine-3", "itin-1", { item_id: "show-3" }),
      ],
      guide([
        stop("guide-stop-1", { item_id: "show-1" }),
        stop("guide-stop-2", { item_id: "show-2" }),
        stop("guide-stop-3", { item_id: "show-3" }),
      ])
    )

    const data = await runAuthenticatedQuery(query, ctx)

    expect(stopsFrom(data)).toHaveLength(3)

    // The guide itself, plus "itin-1" — and "itin-1" asked for under one key, so the
    // loader's cache serves the other two stops.
    const ids = ctx.itineraryLoader.mock.calls.map(([id]) => id)

    expect(new Set(ids.filter((id) => id !== "chill-vibes-only")).size).toBe(1)
  })

  // Nothing to hold anything on.
  it("is empty without a signed-in caller", async () => {
    const data = await runQuery(
      query,
      context([], guide([stop("guide-stop-1")]))
    )

    expect(stopsFrom(data)[0].myItineraries).toEqual([])
    expect(stopsFrom(data)[0].isOnMyItinerary).toBe(false)
  })
})

// Gravity precomputes is_on_my_itinerary, in one query for the whole guide, when the
// parent itinerary was fetched with includeOnMyItinerary: true. isOnMyItinerary should
// use that value directly rather than falling back to its own per-stop lookup.
describe("ItineraryStop.isOnMyItinerary with Gravity's precomputed flag", () => {
  const queryWithArg = gql`
    {
      itinerary(id: "chill-vibes-only", includeOnMyItinerary: true) {
        sections {
          stops {
            internalID
            isOnMyItinerary
          }
        }
      }
    }
  `

  it("passes include_on_my_itinerary through to the itinerary loader", async () => {
    const ctx = context([], guide([stop("guide-stop-1")]))

    await runAuthenticatedQuery(queryWithArg, ctx)

    expect(ctx.itineraryLoader).toHaveBeenCalledWith(
      "chill-vibes-only",
      expect.objectContaining({ include_on_my_itinerary: true })
    )
  })

  it("uses Gravity's true without calling itineraryStopsLoader", async () => {
    const ctx = context(
      [],
      guide([stop("guide-stop-1", { is_on_my_itinerary: true })])
    )

    const data = await runAuthenticatedQuery(queryWithArg, ctx)

    expect(stopsFrom(data)[0].isOnMyItinerary).toBe(true)
    expect(ctx.itineraryStopsLoader).not.toHaveBeenCalled()
  })

  it("uses Gravity's false without calling itineraryStopsLoader", async () => {
    const ctx = context(
      [myStop("mine-1", "itin-1")], // would answer true if the fallback ran
      guide([stop("guide-stop-1", { is_on_my_itinerary: false })])
    )

    const data = await runAuthenticatedQuery(queryWithArg, ctx)

    expect(stopsFrom(data)[0].isOnMyItinerary).toBe(false)
    expect(ctx.itineraryStopsLoader).not.toHaveBeenCalled()
  })

  it("falls back to the per-stop lookup when Gravity sent no flag", async () => {
    const data = await runAuthenticatedQuery(
      query, // no includeOnMyItinerary, so Gravity never sets is_on_my_itinerary
      context([myStop("mine-1", "itin-1")], guide([stop("guide-stop-1")]))
    )

    expect(stopsFrom(data)[0].isOnMyItinerary).toBe(true)
  })
})
