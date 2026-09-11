import {
  attachItemsToStops,
  attachStopItems,
  attachStopItemsToMany,
  loadStopItems,
} from "../stopItems"
import { GravityItinerary, GravityItineraryStop } from "../types"

const buildStop = (
  overrides: Partial<GravityItineraryStop>
): GravityItineraryStop => ({
  id: "stop-id",
  itinerary_section_id: "section-0",
  position: 0,
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
  item_type: null,
  item_id: null,
  event_type: null,
  event_id: null,
  source_url: null,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  ...overrides,
})

const buildItinerary = (
  stopsBySection: GravityItineraryStop[][],
  overrides: Partial<GravityItinerary> = {}
): GravityItinerary => ({
  id: "itinerary-id",
  slug: null,
  title: "Test itinerary",
  subtitle: null,
  description: null,
  author_name: null,
  user_id: "user-1",
  city_slug: "london-united-kingdom",
  is_curated: false,
  visibility: "private",
  share_token: null,
  published_at: null,
  published_by_id: null,
  image_url: null,
  image_urls: null,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  sections_count: stopsBySection.length,
  sections: stopsBySection.map((stops, index) => ({
    id: `section-${index}`,
    itinerary_id: "itinerary-id",
    title: null,
    note: null,
    position: index,
    stops_count: stops.length,
    stops,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
  })),
  ...overrides,
})

describe("loadStopItems", () => {
  it("batches ids by type, calling each loader at most once", async () => {
    const showsLoader = jest.fn().mockResolvedValue([{ _id: "show-1" }])
    const partnerLocationsByIdsLoader = jest
      .fn()
      .mockResolvedValue([{ id: "location-1" }])
    const fairsLoader = jest
      .fn()
      .mockResolvedValue({ body: [{ _id: "fair-1" }], headers: {} })

    const stops = [
      buildStop({ item_type: "PartnerShow", item_id: "show-1" }),
      buildStop({ item_type: "PartnerLocation", item_id: "location-1" }),
      buildStop({ item_type: "PartnerLocation", item_id: "location-1" }),
      buildStop({ item_type: "Fair", item_id: "fair-1" }),
      buildStop({ item_type: null, item_id: null }),
    ]

    const map = await loadStopItems(stops, {
      showsLoader,
      partnerLocationsByIdsLoader,
      fairsLoader,
    } as any)

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(showsLoader).toHaveBeenCalledWith({
      id: ["show-1"],
      size: 1,
      include_local_discovery: true,
    })
    expect(partnerLocationsByIdsLoader).toHaveBeenCalledTimes(1)
    expect(partnerLocationsByIdsLoader).toHaveBeenCalledWith({
      id: ["location-1"],
      size: 1,
    })
    expect(fairsLoader).toHaveBeenCalledTimes(1)
    expect(fairsLoader).toHaveBeenCalledWith({ id: ["fair-1"], size: 1 })

    expect(map.get("PartnerShow:show-1")).toEqual({
      _id: "show-1",
      __typename: "Show",
    })
    expect(map.get("PartnerLocation:location-1")).toEqual({
      id: "location-1",
      __typename: "PartnerLocation",
    })
    expect(map.get("Fair:fair-1")).toEqual({
      _id: "fair-1",
      __typename: "Fair",
    })
  })

  it("keys a partner location by id even when an unrelated _id is present", async () => {
    const partnerLocationsByIdsLoader = jest
      .fn()
      .mockResolvedValue([{ id: "location-1", _id: "unrelated-mongo-id" }])

    const stops = [
      buildStop({ item_type: "PartnerLocation", item_id: "location-1" }),
    ]

    const map = await loadStopItems(stops, {
      partnerLocationsByIdsLoader,
    } as any)

    expect(map.get("PartnerLocation:location-1")).toEqual({
      id: "location-1",
      _id: "unrelated-mongo-id",
      __typename: "PartnerLocation",
    })
  })

  it("keys a partner show by _id even when it also has a slug id", async () => {
    const showsLoader = jest
      .fn()
      .mockResolvedValue([{ _id: "show-1", id: "andy-warhol-retrospective" }])

    const stops = [buildStop({ item_type: "PartnerShow", item_id: "show-1" })]

    const map = await loadStopItems(stops, { showsLoader } as any)

    expect(map.get("PartnerShow:show-1")).toEqual({
      _id: "show-1",
      id: "andy-warhol-retrospective",
      __typename: "Show",
    })
  })

  it("leaves a deleted/unmatched entity out of the map rather than erroring", async () => {
    const fairsLoader = jest.fn().mockResolvedValue({ body: [], headers: {} })

    const stops = [buildStop({ item_type: "Fair", item_id: "gone" })]

    const map = await loadStopItems(stops, { fairsLoader } as any)

    expect(map.get("Fair:gone")).toBeUndefined()
  })

  it("leaves a location missing from the batch response out of the map", async () => {
    const partnerLocationsByIdsLoader = jest.fn().mockResolvedValue([])

    const stops = [buildStop({ item_type: "PartnerLocation", item_id: "gone" })]

    const map = await loadStopItems(stops, {
      partnerLocationsByIdsLoader,
    } as any)

    expect(map.get("PartnerLocation:gone")).toBeUndefined()
  })

  it("skips a type entirely when its loader isn't wired into the context", async () => {
    const stops = [buildStop({ item_type: "Fair", item_id: "fair-1" })]

    const map = await loadStopItems(stops, {} as any)

    expect(map.size).toEqual(0)
  })

  it("returns early without calling any loader when there are no stops", async () => {
    const fairsLoader = jest.fn()

    const map = await loadStopItems([], { fairsLoader } as any)

    expect(map.size).toEqual(0)
    expect(fairsLoader).not.toHaveBeenCalled()
  })

  it("propagates a loader failure instead of swallowing it into a null item", async () => {
    const fairsLoader = jest.fn().mockRejectedValue(new Error("Gravity 500"))

    const stops = [buildStop({ item_type: "Fair", item_id: "fair-1" })]

    await expect(loadStopItems(stops, { fairsLoader } as any)).rejects.toThrow(
      "Gravity 500"
    )
  })

  it("propagates a location loader failure instead of swallowing it into a null item", async () => {
    const partnerLocationsByIdsLoader = jest
      .fn()
      .mockRejectedValue(new Error("Gravity 500"))

    const stops = [
      buildStop({ item_type: "PartnerLocation", item_id: "loc-1" }),
    ]

    await expect(
      loadStopItems(stops, { partnerLocationsByIdsLoader } as any)
    ).rejects.toThrow("Gravity 500")
  })
})

describe("attachStopItems", () => {
  it("resolves stops across every section in a single batch per type", async () => {
    const showsLoader = jest.fn().mockResolvedValue([{ _id: "show-1" }])

    const itinerary = buildItinerary([
      [buildStop({ item_type: "PartnerShow", item_id: "show-1" })],
      [buildStop({ item_type: "PartnerShow", item_id: "show-1" })],
    ])

    await attachStopItems(itinerary, { showsLoader } as any)

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(showsLoader).toHaveBeenCalledWith({
      id: ["show-1"],
      size: 1,
      include_local_discovery: true,
    })

    const resolvedItems = itinerary.sections.flatMap((section) =>
      section.stops.map((stop: any) => stop._resolvedItem)
    )
    expect(resolvedItems).toEqual([
      { _id: "show-1", __typename: "Show" },
      { _id: "show-1", __typename: "Show" },
    ])
  })

  it("stamps null onto a stop with no item reference", async () => {
    const itinerary = buildItinerary([[buildStop({})]])

    await attachStopItems(itinerary, {} as any)

    expect((itinerary.sections[0].stops[0] as any)._resolvedItem).toBeNull()
  })

  it("resolves without throwing and calls no loader when sections is absent", async () => {
    const showsLoader = jest.fn()
    const itinerary = buildItinerary([])
    delete (itinerary as any).sections

    await expect(
      attachStopItems(itinerary, { showsLoader } as any)
    ).resolves.toBe(itinerary)
    expect(showsLoader).not.toHaveBeenCalled()
  })

  it("resolves without throwing and calls no loader when a section has no stops", async () => {
    const showsLoader = jest.fn()
    const itinerary = buildItinerary([[]])
    delete (itinerary.sections[0] as any).stops

    await expect(
      attachStopItems(itinerary, { showsLoader } as any)
    ).resolves.toBe(itinerary)
    expect(showsLoader).not.toHaveBeenCalled()
  })
})

describe("event resolution", () => {
  it("picks a show event out of the show payload with no fair loader call", async () => {
    const showsLoader = jest.fn().mockResolvedValue([
      {
        _id: "show-1",
        events: [
          { _id: "event-1", title: "Opening Reception" },
          { _id: "event-2", title: "Closing Reception" },
        ],
      },
    ])
    const fairEventsLoader = jest.fn()

    const stops = [
      buildStop({
        item_type: "PartnerShow",
        item_id: "show-1",
        event_type: "PartnerShowEvent",
        event_id: "event-1",
      }),
    ]

    await attachItemsToStops(stops, { showsLoader, fairEventsLoader } as any)

    expect((stops[0] as any)._resolvedEvent).toEqual({
      _id: "event-1",
      title: "Opening Reception",
      __typename: "ShowEventType",
    })
    expect(fairEventsLoader).not.toHaveBeenCalled()
  })

  it("resolves a fair event with one fairEventsLoader call for two stops on the same fair", async () => {
    const fairsLoader = jest
      .fn()
      .mockResolvedValue({ body: [{ _id: "fair-1" }], headers: {} })
    const fairEventsLoader = jest.fn().mockResolvedValue({
      body: [
        { id: "fair-event-1", name: "Booth Talk" },
        { id: "fair-event-2", name: "VIP Preview" },
      ],
      headers: {},
    })

    const stops = [
      buildStop({
        item_type: "Fair",
        item_id: "fair-1",
        event_type: "FairEvent",
        event_id: "fair-event-1",
      }),
      buildStop({
        item_type: "Fair",
        item_id: "fair-1",
        event_type: "FairEvent",
        event_id: "fair-event-2",
      }),
    ]

    await attachItemsToStops(stops, { fairsLoader, fairEventsLoader } as any)

    expect(fairEventsLoader).toHaveBeenCalledTimes(1)
    expect(fairEventsLoader).toHaveBeenCalledWith("fair-1")
    expect(stops.map((stop: any) => stop._resolvedEvent)).toEqual([
      { id: "fair-event-1", name: "Booth Talk", __typename: "FairEvent" },
      { id: "fair-event-2", name: "VIP Preview", __typename: "FairEvent" },
    ])
  })

  it("resolves null when the event id doesn't match any event", async () => {
    const showsLoader = jest
      .fn()
      .mockResolvedValue([{ _id: "show-1", events: [] }])

    const stops = [
      buildStop({
        item_type: "PartnerShow",
        item_id: "show-1",
        event_type: "PartnerShowEvent",
        event_id: "gone",
      }),
    ]

    await attachItemsToStops(stops, { showsLoader } as any)

    expect((stops[0] as any)._resolvedEvent).toBeNull()
  })

  it("resolves null and calls no loader for a stop with no event", async () => {
    const fairEventsLoader = jest.fn()

    const stops = [buildStop({})]

    await attachItemsToStops(stops, { fairEventsLoader } as any)

    expect((stops[0] as any)._resolvedEvent).toBeNull()
    expect(fairEventsLoader).not.toHaveBeenCalled()
  })

  it("leaves a rejecting fair's events null and resolves the other fair's events", async () => {
    const fairEventsLoader = jest.fn().mockImplementation((fairId) => {
      if (fairId === "fair-bad") return Promise.reject(new Error("Gravity 500"))
      return Promise.resolve({
        body: [{ id: "fair-event-1", name: "Booth Talk" }],
        headers: {},
      })
    })

    const stops = [
      buildStop({
        item_type: "Fair",
        item_id: "fair-bad",
        event_type: "FairEvent",
        event_id: "fair-event-1",
      }),
      buildStop({
        item_type: "Fair",
        item_id: "fair-good",
        event_type: "FairEvent",
        event_id: "fair-event-1",
      }),
    ]

    await expect(
      attachItemsToStops(stops, { fairEventsLoader } as any)
    ).resolves.toBe(stops)

    expect((stops[0] as any)._resolvedEvent).toBeNull()
    expect((stops[1] as any)._resolvedEvent).toEqual({
      id: "fair-event-1",
      name: "Booth Talk",
      __typename: "FairEvent",
    })
  })
})

describe("attachItemsToStops", () => {
  it("resolves a flat list of stops in a single batch and stamps each one", async () => {
    const showsLoader = jest.fn().mockResolvedValue([{ _id: "show-1" }])

    const stops = [
      buildStop({ item_type: "PartnerShow", item_id: "show-1" }),
      buildStop({ item_type: "PartnerShow", item_id: "show-1" }),
    ]

    await attachItemsToStops(stops, { showsLoader } as any)

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(stops.map((stop: any) => stop._resolvedItem)).toEqual([
      { _id: "show-1", __typename: "Show" },
      { _id: "show-1", __typename: "Show" },
    ])
  })
})

describe("attachStopItemsToMany", () => {
  it("dedupes ids across itineraries into a single loader call and stamps every stop", async () => {
    const showsLoader = jest.fn().mockResolvedValue([{ _id: "show-1" }])

    const itineraryA = buildItinerary(
      [[buildStop({ item_type: "PartnerShow", item_id: "show-1" })]],
      { id: "itinerary-a" }
    )
    const itineraryB = buildItinerary(
      [[buildStop({ item_type: "PartnerShow", item_id: "show-1" })]],
      { id: "itinerary-b" }
    )

    await attachStopItemsToMany([itineraryA, itineraryB], {
      showsLoader,
    } as any)

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(showsLoader).toHaveBeenCalledWith({
      id: ["show-1"],
      size: 1,
      include_local_discovery: true,
    })

    expect((itineraryA.sections[0].stops[0] as any)._resolvedItem).toEqual({
      _id: "show-1",
      __typename: "Show",
    })
    expect((itineraryB.sections[0].stops[0] as any)._resolvedItem).toEqual({
      _id: "show-1",
      __typename: "Show",
    })
  })
})
