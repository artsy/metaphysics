import { createBatchItineraryStopMembershipsLoader } from "../batchItineraryStopMembershipsLoader"

describe("batch itinerary stop memberships", () => {
  const show = { item_type: "PartnerShow", item_id: "show-1" }

  it("deduplicates identities and preserves order", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValue([
        { is_on_my_itineraries: true },
        { is_on_my_itineraries: false },
      ])
    const load = createBatchItineraryStopMembershipsLoader(fetch)
    const results = await Promise.all([
      load(show),
      load({ title: "Cafe" }),
      load({ ...show, title: "Override" }),
    ])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith({
      stops: JSON.stringify([show, { title: "Cafe", address: null }]),
      include_itineraries: false,
    })
    expect(results.map((result) => result.is_on_my_itineraries)).toEqual([
      true,
      false,
      true,
    ])
  })

  it("combines boolean and detail selections in one request", async () => {
    const result = { is_on_my_itineraries: true, my_itineraries: [] }
    const fetch = jest.fn().mockResolvedValue([result])
    const load = createBatchItineraryStopMembershipsLoader(fetch)
    expect(await Promise.all([load(show), load(show, true)])).toEqual([
      result,
      result,
    ])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith({
      stops: JSON.stringify([show]),
      include_itineraries: true,
    })
  })

  it("fetches details when requested after a boolean-only response", async () => {
    const fetch = jest
      .fn()
      .mockResolvedValueOnce([{ is_on_my_itineraries: true }])
      .mockResolvedValueOnce([
        { is_on_my_itineraries: true, my_itineraries: [] },
      ])
    const load = createBatchItineraryStopMembershipsLoader(fetch)
    await load(show)
    expect(await load(show, true)).toHaveProperty("my_itineraries", [])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("bounds batches and isolates caches between requests", async () => {
    const fetch = jest.fn(async ({ stops }) =>
      JSON.parse(stops).map(() => ({ is_on_my_itineraries: false }))
    )
    const load = createBatchItineraryStopMembershipsLoader(fetch)
    await Promise.all(
      Array.from({ length: 45 }, (_, i) =>
        load({ item_type: "PartnerShow", item_id: `show-${i}` })
      )
    )
    expect(
      fetch.mock.calls.map(([params]) => JSON.parse(params.stops).length)
    ).toEqual([20, 20, 5])
    await createBatchItineraryStopMembershipsLoader(fetch)(show)
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it("rejects failures instead of claiming the stop is not saved", async () => {
    const load = createBatchItineraryStopMembershipsLoader(
      jest.fn().mockRejectedValue(new Error("Unavailable"))
    )
    await expect(load(show)).rejects.toThrow("Unavailable")
  })
})
