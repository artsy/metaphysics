import { attachStopItems, loadStopItems } from "../stopItems"
import { FixtureItinerary, FixtureItineraryStop } from "../fixtures/itineraries"

const buildStop = (
  overrides: Partial<FixtureItineraryStop>
): FixtureItineraryStop => ({
  id: "stop-id",
  position: 0,
  title: null,
  title_override: null,
  address: null,
  address_override: null,
  image_url: null,
  latitude: null,
  longitude: null,
  start_at: null,
  end_at: null,
  note: null,
  category: null,
  is_free_admission: null,
  item_type: null,
  item_id: null,
  event_type: null,
  event_id: null,
  ...overrides,
})

describe("loadStopItems", () => {
  it("batches ids by type, calling each loader at most once", async () => {
    const showsLoader = jest.fn().mockResolvedValue([{ _id: "show-1" }])
    const partnersLoader = jest
      .fn()
      .mockResolvedValue({ body: [{ _id: "partner-1" }], headers: {} })
    const fairsLoader = jest
      .fn()
      .mockResolvedValue({ body: [{ _id: "fair-1" }], headers: {} })

    const stops = [
      buildStop({ item_type: "PartnerShow", item_id: "show-1" }),
      buildStop({ item_type: "Partner", item_id: "partner-1" }),
      // A second stop referencing the same Partner id -- must not trigger
      // a second partnersLoader call.
      buildStop({ item_type: "Partner", item_id: "partner-1" }),
      buildStop({ item_type: "Fair", item_id: "fair-1" }),
      // No item behind this stop at all.
      buildStop({ item_type: null, item_id: null }),
    ]

    const map = await loadStopItems(stops, {
      showsLoader,
      partnersLoader,
      fairsLoader,
    } as any)

    expect(showsLoader).toHaveBeenCalledTimes(1)
    expect(showsLoader).toHaveBeenCalledWith({ id: ["show-1"] })
    expect(partnersLoader).toHaveBeenCalledTimes(1)
    expect(partnersLoader).toHaveBeenCalledWith({ id: ["partner-1"] })
    expect(fairsLoader).toHaveBeenCalledTimes(1)
    expect(fairsLoader).toHaveBeenCalledWith({ id: ["fair-1"] })

    expect(map.get("PartnerShow:show-1")).toEqual({
      _id: "show-1",
      __typename: "Show",
    })
    expect(map.get("Partner:partner-1")).toEqual({
      _id: "partner-1",
      __typename: "Partner",
    })
    expect(map.get("Fair:fair-1")).toEqual({
      _id: "fair-1",
      __typename: "Fair",
    })
  })

  it("leaves a deleted/unmatched entity out of the map rather than erroring", async () => {
    const partnersLoader = jest
      .fn()
      .mockResolvedValue({ body: [], headers: {} })

    const stops = [buildStop({ item_type: "Partner", item_id: "gone" })]

    const map = await loadStopItems(stops, { partnersLoader } as any)

    expect(map.get("Partner:gone")).toBeUndefined()
  })

  it("skips a type entirely when its loader isn't wired into the context", async () => {
    const stops = [buildStop({ item_type: "Fair", item_id: "fair-1" })]

    const map = await loadStopItems(stops, {} as any)

    expect(map.size).toEqual(0)
  })

  it("propagates a loader failure instead of swallowing it into a null item", async () => {
    const partnersLoader = jest.fn().mockRejectedValue(new Error("Gravity 500"))

    const stops = [buildStop({ item_type: "Partner", item_id: "partner-1" })]

    await expect(
      loadStopItems(stops, { partnersLoader } as any)
    ).rejects.toThrow("Gravity 500")
  })
})

describe("attachStopItems", () => {
  const buildItinerary = (
    stopsBySection: FixtureItineraryStop[][]
  ): FixtureItinerary => ({
    id: "itinerary-id",
    slug: null,
    name: "Test itinerary",
    subtitle: null,
    description: null,
    author_name: null,
    user_id: null,
    city_slug: "london-united-kingdom",
    is_curated: false,
    share_token: null,
    published_at: null,
    image_url: null,
    image_urls: null,
    image: null,
    sections_count: stopsBySection.length,
    sections: stopsBySection.map((stops, index) => ({
      id: `section-${index}`,
      title: null,
      position: index,
      stops_count: stops.length,
      stops,
    })),
  })

  it("resolves stops across every section in a single batch per type", async () => {
    const partnersLoader = jest
      .fn()
      .mockResolvedValue({ body: [{ _id: "partner-1" }], headers: {} })

    const itinerary = buildItinerary([
      [buildStop({ item_type: "Partner", item_id: "partner-1" })],
      [buildStop({ item_type: "Partner", item_id: "partner-1" })],
    ])

    await attachStopItems(itinerary, { partnersLoader } as any)

    expect(partnersLoader).toHaveBeenCalledTimes(1)
    expect(partnersLoader).toHaveBeenCalledWith({ id: ["partner-1"] })

    const resolvedItems = itinerary.sections.flatMap((section) =>
      section.stops.map((stop: any) => stop._resolvedItem)
    )
    expect(resolvedItems).toEqual([
      { _id: "partner-1", __typename: "Partner" },
      { _id: "partner-1", __typename: "Partner" },
    ])
  })

  it("stamps null onto a stop with no item reference", async () => {
    const itinerary = buildItinerary([[buildStop({})]])

    await attachStopItems(itinerary, {} as any)

    expect((itinerary.sections[0].stops[0] as any)._resolvedItem).toBeNull()
  })
})
