import { runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"
import gql from "lib/gql"
import { createBatchItineraryStopMembershipsLoader } from "lib/loaders/batchItineraryStopMembershipsLoader"

describe("itineraryStop", () => {
  const stop = {
    id: "stop-1",
    item_type: "PartnerShow",
    item_id: "show-1",
    title: "A show",
    position: 0,
  }
  const query = gql`
    {
      itineraryStop(id: "stop-1") {
        internalID
        isOnMyItineraries
        myItineraries {
          internalID
          title
        }
      }
    }
  `

  it("resolves memberships from a standalone stop without loading its parent", async () => {
    const fetch = jest.fn().mockResolvedValue([
      {
        is_on_my_itineraries: true,
        my_itineraries: [{ id: "mine", title: "My guide" }],
      },
    ])
    const context = {
      itineraryStopLoader: jest.fn().mockResolvedValue(stop),
      itineraryLoader: jest.fn(),
      showsLoader: jest.fn(),
      itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
        fetch
      ),
    }
    const data = await runQuery(query, context)
    expect(data.itineraryStop).toEqual({
      internalID: "stop-1",
      isOnMyItineraries: true,
      myItineraries: [{ internalID: "mine", title: "My guide" }],
    })
    expect(context.itineraryStopLoader).toHaveBeenCalledWith("stop-1", {})
    expect(context.itineraryLoader).not.toHaveBeenCalled()
    expect(context.showsLoader).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith({
      stops: JSON.stringify([{ item_type: "PartnerShow", item_id: "show-1" }]),
      include_itineraries: true,
    })
  })

  it("returns false and empty membership lists when signed out", async () => {
    const data = await runQuery(query, {
      itineraryStopLoader: jest.fn().mockResolvedValue(stop),
    })
    expect(data.itineraryStop.isOnMyItineraries).toBe(false)
    expect(data.itineraryStop.myItineraries).toEqual([])
  })

  it("forwards the share token for an unlisted parent", async () => {
    const itineraryStopLoader = jest.fn().mockResolvedValue(stop)
    await runQuery(
      gql`
        {
          itineraryStop(id: "stop-1", shareToken: "token") {
            internalID
          }
        }
      `,
      { itineraryStopLoader }
    )
    expect(itineraryStopLoader).toHaveBeenCalledWith("stop-1", {
      share_token: "token",
    })
  })

  it("returns null for a missing or inaccessible stop", async () => {
    const data = await runQuery(query, {
      itineraryStopLoader: jest
        .fn()
        .mockRejectedValue(new HTTPError("Not found", 404)),
    })
    expect(data.itineraryStop).toBeNull()
  })

  it("propagates upstream failures", async () => {
    await expect(
      runQuery(query, {
        itineraryStopLoader: jest
          .fn()
          .mockRejectedValue(new HTTPError("Unavailable", 500)),
      })
    ).rejects.toThrow("Unavailable")
  })

  it("hydrates the item and event when selected", async () => {
    const data = await runQuery(
      gql`
        {
          itineraryStop(id: "stop-1") {
            item {
              ... on Show {
                internalID
              }
            }
            event {
              ... on ShowEventType {
                title
              }
            }
          }
        }
      `,
      {
        itineraryStopLoader: jest.fn().mockResolvedValue({
          ...stop,
          event_type: "PartnerShowEvent",
          event_id: "event-1",
        }),
        showsLoader: jest
          .fn()
          .mockResolvedValue([
            { _id: "show-1", events: [{ _id: "event-1", title: "Opening" }] },
          ]),
      }
    )
    expect(data.itineraryStop.item).toEqual({ internalID: "show-1" })
    expect(data.itineraryStop.event).toEqual({ title: "Opening" })
  })

  it("hydrates the linked item's schedule for displayOpeningHours even without item or event selected", async () => {
    const data = await runQuery(
      gql`
        {
          itineraryStop(id: "stop-1") {
            openingHours {
              days
              hours
            }
            displayOpeningHours {
              days
              hours
            }
          }
        }
      `,
      {
        itineraryStopLoader: jest.fn().mockResolvedValue({
          id: "stop-1",
          item_type: "PartnerLocation",
          item_id: "location-1",
          title: "A gallery",
          position: 0,
          opening_hours: [],
        }),
        partnerLocationsByIdsLoader: jest.fn().mockResolvedValue([
          {
            id: "location-1",
            day_schedules: [
              { day_of_week: "Monday", start_time: 36000, end_time: 64800 },
            ],
          },
        ]),
      }
    )
    expect(data.itineraryStop.openingHours).toEqual([])
    expect(data.itineraryStop.displayOpeningHours).toEqual([
      { days: "Monday", hours: "10am–6pm" },
      { days: "Tuesday–Sunday", hours: "Closed" },
    ])
  })

  it("hydrates nested myItineraries stops for displayOpeningHours without item selected", async () => {
    const fetch = jest.fn().mockResolvedValue([
      {
        is_on_my_itineraries: true,
        my_itineraries: [
          {
            id: "mine",
            sections: [
              {
                id: "section-1",
                stops: [
                  {
                    id: "nested-stop",
                    item_type: "PartnerLocation",
                    item_id: "location-1",
                    title: "A gallery",
                    position: 0,
                    opening_hours: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ])
    const data = await runQuery(
      gql`
        {
          itineraryStop(id: "stop-1") {
            myItineraries {
              sections {
                stops {
                  displayOpeningHours {
                    days
                    hours
                  }
                }
              }
            }
          }
        }
      `,
      {
        itineraryStopLoader: jest.fn().mockResolvedValue(stop),
        itineraryStopMembershipsLoader: createBatchItineraryStopMembershipsLoader(
          fetch
        ),
        partnerLocationsByIdsLoader: jest.fn().mockResolvedValue([
          {
            id: "location-1",
            day_schedules: [
              { day_of_week: "Monday", start_time: 36000, end_time: 64800 },
            ],
          },
        ]),
      }
    )
    expect(
      data.itineraryStop.myItineraries[0].sections[0].stops[0]
        .displayOpeningHours
    ).toEqual([
      { days: "Monday", hours: "10am–6pm" },
      { days: "Tuesday–Sunday", hours: "Closed" },
    ])
  })
})
