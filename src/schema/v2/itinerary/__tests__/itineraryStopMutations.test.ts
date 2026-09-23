import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"
import { FormattedDaySchedules } from "schema/v2/types/formattedDaySchedules"

// Mirrors Gravity's single itinerary_stop JSON, pointing at a `PartnerShow`
// so `item` has something to resolve.
const gravityStop = (overrides = {}) => ({
  id: "stop-id",
  itinerary_section_id: "section-id",
  position: 0,
  item_type: "PartnerShow",
  item_id: "show-id",
  event_type: null,
  event_id: null,
  title: null,
  address: null,
  image_url: null,
  latitude: null,
  longitude: null,
  start_at: null,
  end_at: null,
  time_zone: "America/New_York",
  note: null,
  category: "SHOW",
  is_free_admission: true,
  source_url: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  ...overrides,
})

const successFragment = gql`
  ... on ItineraryStopMutationSuccess {
    itineraryStop {
      internalID
      title
      category
      isFreeAdmission
      openingHours {
        days
        hours
      }
      timeZone
      item {
        __typename
        ... on Show {
          internalID
        }
      }
    }
  }
`

const failureFragment = gql`
  ... on ItineraryStopMutationFailure {
    mutationError {
      type
      message
      statusCode
      fieldErrors {
        name
        message
      }
    }
  }
`

const withShowsLoader = (loader: jest.Mock) => ({
  showsLoader: jest.fn().mockResolvedValue({
    body: [{ _id: "show-id", id: "show-id", name: "A Show" }],
    headers: {},
  }),
  createItineraryStopLoader: loader,
  updateItineraryStopLoader: loader,
  deleteItineraryStopLoader: loader,
})

const paramError = new HTTPError("Bad Request", 400, {
  type: "param_error",
  message: "Longitude can't be blank.",
  detail: { longitude: ["can't be blank"] },
})

const forbiddenError = new HTTPError("Forbidden", 403, { error: "Forbidden" })

describe("createItineraryStop", () => {
  it("forwards the image source ID and share token without reading the source in Metaphysics", async () => {
    const createItineraryStopLoader = jest
      .fn()
      .mockResolvedValue(
        gravityStop({ item_type: null, item_id: null, title: "Cafe" })
      )
    await runAuthenticatedQuery(
      gql`
        mutation {
          createItineraryStop(
            input: {
              itinerarySectionID: "section-id"
              title: "Cafe"
              sourceStopID: "source-id"
              sourceShareToken: "token"
            }
          ) {
            responseOrError {
              ... on ItineraryStopMutationSuccess {
                itineraryStop {
                  internalID
                }
              }
            }
          }
        }
      `,
      { createItineraryStopLoader }
    )
    expect(createItineraryStopLoader).toHaveBeenCalledWith({
      itinerary_section_id: "section-id",
      title: "Cafe",
      source_stop_id: "source-id",
      source_share_token: "token",
    })
  })

  const mutation = gql`
    mutation {
      createItineraryStop(
        input: {
          itinerarySectionID: "section-id"
          itemType: SHOW
          itemID: "show-id"
          eventType: SHOW_EVENT
          eventID: "event-id"
          category: SHOW
          isFreeAdmission: true
          timeZone: "America/New_York"
        }
      ) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith({
      itinerary_section_id: "section-id",
      item_type: "PartnerShow",
      item_id: "show-id",
      event_type: "PartnerShowEvent",
      event_id: "event-id",
      category: "SHOW",
      is_free_admission: true,
      time_zone: "America/New_York",
    })
  })

  it("rejects an invalid itemType before calling the loader", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await expect(
      runAuthenticatedQuery(
        gql`
          mutation {
            createItineraryStop(
              input: {
                itinerarySectionID: "section-id"
                itemType: GALLERY
                itemID: "show-id"
              }
            ) {
              responseOrError {
                ${successFragment}
              }
            }
          }
        `,
        context
      )
    ).rejects.toThrow(/GALLERY/)

    expect(loader).not.toHaveBeenCalled()
  })

  it("maps openingHours to opening_hours, and omits it when not given", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          createItineraryStop(
            input: {
              itinerarySectionID: "section-id"
              openingHours: [{ days: "Sat - Thurs", hours: "10am-5pm" }]
            }
          ) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith({
      itinerary_section_id: "section-id",
      opening_hours: [{ days: "Sat - Thurs", hours: "10am-5pm" }],
    })

    loader.mockClear()

    await runAuthenticatedQuery(
      gql`
        mutation {
          createItineraryStop(input: { itinerarySectionID: "section-id" }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader.mock.calls[0][0]).not.toHaveProperty("opening_hours")
  })

  it("clears openingHours when given an empty list", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          createItineraryStop(
            input: { itinerarySectionID: "section-id", openingHours: [] }
          ) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith({
      itinerary_section_id: "section-id",
      opening_hours: [],
    })
  })

  it("returns the success payload with the resolved item", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createItineraryStop.responseOrError.itineraryStop
    ).toMatchObject({
      internalID: "stop-id",
      category: "SHOW",
      isFreeAdmission: true,
      openingHours: [],
      timeZone: "America/New_York",
      item: { __typename: "Show", internalID: "show-id" },
    })
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          createItineraryStop(
            input: {
              itinerarySectionID: "section-id"
              itemType: SHOW
              itemID: "show-id"
              clientMutationId: "abc"
            }
          ) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader.mock.calls[0][0]).not.toHaveProperty("client_mutation_id")
  })

  it("still returns success when item enrichment fails", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = {
      ...withShowsLoader(loader),
      showsLoader: jest.fn().mockRejectedValue(new Error("Gravity is down")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createItineraryStop.responseOrError.itineraryStop
    ).toMatchObject({
      internalID: "stop-id",
      item: null,
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createItineraryStop.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Longitude can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "longitude", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createItineraryStop.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("ItineraryStop.displayOpeningHours", () => {
  const daySchedules = [
    { day_of_week: "Monday", start_time: 36000, end_time: 64800 },
  ]
  const formattedDaySchedules = FormattedDaySchedules.resolve(
    daySchedules as any
  )

  const query = gql`
    mutation {
      createItineraryStop(input: { itinerarySectionID: "section-id" }) {
        responseOrError {
          ... on ItineraryStopMutationSuccess {
            itineraryStop {
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
        }
      }
    }
  `

  const create = (context: Record<string, unknown>) =>
    runAuthenticatedQuery(query, context).then(
      (result) => result.createItineraryStop.responseOrError.itineraryStop
    )

  it("prefers the stop's own lines over the linked item's schedule", async () => {
    const loader = jest.fn().mockResolvedValue(
      gravityStop({
        item_type: "PartnerShow",
        opening_hours: [{ days: "Sat - Thurs", hours: "10am-5pm" }],
      })
    )
    const stop = await create({
      ...withShowsLoader(loader),
      showsLoader: jest.fn().mockResolvedValue({
        body: [{ _id: "show-id", location: { day_schedules: daySchedules } }],
        headers: {},
      }),
    })

    expect(stop.openingHours).toEqual([
      { days: "Sat - Thurs", hours: "10am-5pm" },
    ])
    expect(stop.displayOpeningHours).toEqual([
      { days: "Sat - Thurs", hours: "10am-5pm" },
    ])
  })

  it("falls back to the linked PartnerLocation's schedule", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(
        gravityStop({ item_type: "PartnerLocation", opening_hours: [] })
      )
    const stop = await create({
      createItineraryStopLoader: loader,
      partnerLocationsByIdsLoader: jest
        .fn()
        .mockResolvedValue([{ id: "show-id", day_schedules: daySchedules }]),
    })

    expect(stop.openingHours).toEqual([])
    expect(stop.displayOpeningHours).toEqual(formattedDaySchedules)
  })

  it("falls back to a PartnerShow's location schedule", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(
        gravityStop({ item_type: "PartnerShow", opening_hours: [] })
      )
    const stop = await create({
      createItineraryStopLoader: loader,
      showsLoader: jest.fn().mockResolvedValue({
        body: [{ _id: "show-id", location: { day_schedules: daySchedules } }],
        headers: {},
      }),
    })

    expect(stop.displayOpeningHours).toEqual(formattedDaySchedules)
  })

  it("yields [] for a show whose location has no schedule (e.g. a fair location)", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(
        gravityStop({ item_type: "PartnerShow", opening_hours: [] })
      )
    const stop = await create({
      createItineraryStopLoader: loader,
      showsLoader: jest.fn().mockResolvedValue({
        body: [{ _id: "show-id", fair_location: { city: "Basel" } }],
        headers: {},
      }),
    })

    expect(stop.displayOpeningHours).toEqual([])
  })

  it("yields [] for a fair stop", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(gravityStop({ item_type: "Fair", opening_hours: [] }))
    const stop = await create({
      createItineraryStopLoader: loader,
      fairsLoader: jest.fn().mockResolvedValue({ body: [], headers: {} }),
    })

    expect(stop.displayOpeningHours).toEqual([])
  })

  it("yields [] for a stop with no item", async () => {
    const loader = jest.fn().mockResolvedValue(
      gravityStop({
        item_type: null,
        item_id: null,
        title: "Cafe",
        opening_hours: [],
      })
    )
    const stop = await create({ createItineraryStopLoader: loader })

    expect(stop.displayOpeningHours).toEqual([])
  })
})

describe("updateItineraryStop", () => {
  const mutation = gql`
    mutation {
      updateItineraryStop(
        input: {
          id: "stop-id"
          position: 0
          itemType: SHOW
          eventType: SHOW_EVENT
          isFreeAdmission: null
        }
      ) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("stop-id", {
      position: 0,
      item_type: "PartnerShow",
      event_type: "PartnerShowEvent",
      is_free_admission: null,
    })
  })

  it("rejects an invalid itemType before calling the loader", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await expect(
      runAuthenticatedQuery(
        gql`
          mutation {
            updateItineraryStop(input: { id: "stop-id", itemType: GALLERY }) {
              responseOrError {
                ${successFragment}
              }
            }
          }
        `,
        context
      )
    ).rejects.toThrow(/GALLERY/)

    expect(loader).not.toHaveBeenCalled()
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateItineraryStop(
            input: { id: "stop-id", position: 0, clientMutationId: "abc" }
          ) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader.mock.calls[0][1]).not.toHaveProperty("client_mutation_id")
  })

  it("maps openingHours to opening_hours, and omits it when not given", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateItineraryStop(
            input: {
              id: "stop-id"
              openingHours: [{ days: "Sat - Thurs", hours: "10am-5pm" }]
            }
          ) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith("stop-id", {
      opening_hours: [{ days: "Sat - Thurs", hours: "10am-5pm" }],
    })

    loader.mockClear()

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateItineraryStop(input: { id: "stop-id" }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader.mock.calls[0][1]).not.toHaveProperty("opening_hours")
  })

  it("clears openingHours when given an empty list", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateItineraryStop(input: { id: "stop-id", openingHours: [] }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith("stop-id", { opening_hours: [] })
  })

  it("returns the success payload with the resolved item", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateItineraryStop.responseOrError.itineraryStop
    ).toMatchObject({
      internalID: "stop-id",
      category: "SHOW",
      item: { __typename: "Show", internalID: "show-id" },
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.updateItineraryStop.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Longitude can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "longitude", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateItineraryStop.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("deleteItineraryStop", () => {
  const mutation = gql`
    mutation {
      deleteItineraryStop(input: { id: "stop-id" }) {
        responseOrError {
          ... on ItineraryStopMutationSuccess {
            itineraryStop {
              internalID
            }
          }
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("stop-id", {})
  })

  it("returns the success payload", async () => {
    const loader = jest.fn().mockResolvedValue(gravityStop())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteItineraryStop.responseOrError.itineraryStop
    ).toMatchObject({
      internalID: "stop-id",
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.deleteItineraryStop.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Longitude can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "longitude", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteItineraryStop.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("schema exposure", () => {
  it("exposes every itinerary stop mutation on the schema", () => {
    const { schema } = require("schema/v2")
    const mutationFields = schema.getMutationType()!.getFields()

    ;[
      "createItineraryStop",
      "updateItineraryStop",
      "deleteItineraryStop",
    ].forEach((name) => {
      expect(mutationFields[name]).toBeDefined()
    })
  })
})
