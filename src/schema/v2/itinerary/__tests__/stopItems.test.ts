import { attachStopItems, loadStopItems } from "../stopItems"
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

describe("loadStopItems", () => {
  it("batches ids by type, calling each loader at most once", async () => {
    const showsLoader = jest.fn().mockResolvedValue([{ _id: "show-1" }])
    const partnerLocationByIdLoader = jest
      .fn()
      .mockResolvedValue({ _id: "location-1" })
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
      partnerLocationByIdLoader,
      fairsLoader,
    } as any)

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(showsLoader).toHaveBeenCalledWith({ id: ["show-1"] })
    expect(partnerLocationByIdLoader).toHaveBeenCalledTimes(1)
    expect(partnerLocationByIdLoader).toHaveBeenCalledWith("location-1")
    expect(fairsLoader).toHaveBeenCalledTimes(1)
    expect(fairsLoader).toHaveBeenCalledWith({ id: ["fair-1"] })

    expect(map.get("PartnerShow:show-1")).toEqual({
      _id: "show-1",
      __typename: "Show",
    })
    expect(map.get("PartnerLocation:location-1")).toEqual({
      _id: "location-1",
      __typename: "PartnerLocation",
    })
    expect(map.get("Fair:fair-1")).toEqual({
      _id: "fair-1",
      __typename: "Fair",
    })
  })

  it("leaves a deleted/unmatched entity out of the map rather than erroring", async () => {
    const fairsLoader = jest.fn().mockResolvedValue({ body: [], headers: {} })

    const stops = [buildStop({ item_type: "Fair", item_id: "gone" })]

    const map = await loadStopItems(stops, { fairsLoader } as any)

    expect(map.get("Fair:gone")).toBeUndefined()
  })

  it("leaves out a location that 404s rather than failing the itinerary", async () => {
    const partnerLocationByIdLoader = jest
      .fn()
      .mockRejectedValue(new Error("Not Found"))

    const stops = [buildStop({ item_type: "PartnerLocation", item_id: "gone" })]

    const map = await loadStopItems(stops, {
      partnerLocationByIdLoader,
    } as any)

    expect(map.get("PartnerLocation:gone")).toBeUndefined()
  })

  it("skips a type entirely when its loader isn't wired into the context", async () => {
    const stops = [buildStop({ item_type: "Fair", item_id: "fair-1" })]

    const map = await loadStopItems(stops, {} as any)

    expect(map.size).toEqual(0)
  })

  it("propagates a loader failure instead of swallowing it into a null item", async () => {
    const fairsLoader = jest.fn().mockRejectedValue(new Error("Gravity 500"))

    const stops = [buildStop({ item_type: "Fair", item_id: "fair-1" })]

    await expect(loadStopItems(stops, { fairsLoader } as any)).rejects.toThrow(
      "Gravity 500"
    )
  })
})

describe("attachStopItems", () => {
  const buildItinerary = (
    stopsBySection: GravityItineraryStop[][]
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
  })

  it("resolves stops across every section in a single batch per type", async () => {
    const showsLoader = jest.fn().mockResolvedValue([{ _id: "show-1" }])

    const itinerary = buildItinerary([
      [buildStop({ item_type: "PartnerShow", item_id: "show-1" })],
      [buildStop({ item_type: "PartnerShow", item_id: "show-1" })],
    ])

    await attachStopItems(itinerary, { showsLoader } as any)

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(showsLoader).toHaveBeenCalledWith({ id: ["show-1"] })

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
})
