import { createBatchItineraryStopMembershipsLoader } from "lib/loaders/batchItineraryStopMembershipsLoader"
import { runQuery } from "schema/v2/test/utils"

describe("Show and Fair itinerary memberships", () => {
  const query = `{
    show(id: "show-slug") { isOnMyItineraries }
    fair(id: "fair-slug") { isOnMyItineraries }
  }`
  const items = {
    showLoader: jest.fn().mockResolvedValue({
      id: "show-slug",
      _id: "show-id",
      displayable: true,
    }),
    fairLoader: jest
      .fn()
      .mockResolvedValue({ id: "fair-slug", _id: "fair-id" }),
  }

  it("batches show and fair identities by internal ID without fetching details", async () => {
    const fetchMemberships = jest.fn(async ({ stops }) =>
      JSON.parse(stops).map(({ item_id }) => ({
        is_on_my_itineraries: item_id === "show-id",
      }))
    )
    const result = await runQuery(query, {
      ...items,
      itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
        fetchMemberships
      ),
    })
    expect(result).toEqual({
      show: { isOnMyItineraries: true },
      fair: { isOnMyItineraries: false },
    })
    expect(fetchMemberships).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetchMemberships.mock.calls[0][0].stops)).toEqual(
      expect.arrayContaining([
        { item_type: "PartnerShow", item_id: "show-id" },
        { item_type: "Fair", item_id: "fair-id" },
      ])
    )
    expect(fetchMemberships.mock.calls[0][0].include_itineraries).toBe(false)
  })

  it("returns false and empty memberships when signed out", async () => {
    const result = await runQuery(
      `{
      show(id: "show-slug") { isOnMyItineraries myItineraryStopMemberships { itineraryID stopIDs } }
      fair(id: "fair-slug") { isOnMyItineraries myItineraryStopMemberships { itineraryID stopIDs } }
    }`,
      items
    )
    expect(result).toEqual({
      show: { isOnMyItineraries: false, myItineraryStopMemberships: [] },
      fair: { isOnMyItineraries: false, myItineraryStopMemberships: [] },
    })
  })

  it("returns all matching stop IDs only when details are selected", async () => {
    const fetchMemberships = jest.fn().mockResolvedValue([
      {
        is_on_my_itineraries: true,
        my_itineraries: [
          {
            id: "itinerary-id",
            sections: [
              {
                stops: [
                  { id: "first", item_type: "PartnerShow", item_id: "show-id" },
                ],
              },
              {
                stops: [
                  {
                    id: "second",
                    item_type: "PartnerShow",
                    item_id: "show-id",
                    event_id: "event-id",
                  },
                  { id: "unrelated", item_type: "Fair", item_id: "fair-id" },
                ],
              },
            ],
          },
        ],
      },
    ])
    const result = await runQuery(
      `{ show(id: "show-slug") {
      isOnMyItineraries myItineraryStopMemberships { itineraryID stopIDs }
    } }`,
      {
        ...items,
        itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
          fetchMemberships
        ),
      }
    )
    expect(result.show.myItineraryStopMemberships).toEqual([
      { itineraryID: "itinerary-id", stopIDs: ["first", "second"] },
    ])
    expect(fetchMemberships).toHaveBeenCalledTimes(1)
    expect(fetchMemberships.mock.calls[0][0].include_itineraries).toBe(true)
  })
})
