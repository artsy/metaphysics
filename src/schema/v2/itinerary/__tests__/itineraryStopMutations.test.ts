import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

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
  const mutation = gql`
    mutation {
      createItineraryStop(
        input: {
          itinerarySectionID: "section-id"
          itemType: "PartnerShow"
          itemID: "show-id"
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
      category: "SHOW",
      is_free_admission: true,
      time_zone: "America/New_York",
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
              itemType: "PartnerShow"
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

describe("updateItineraryStop", () => {
  const mutation = gql`
    mutation {
      updateItineraryStop(
        input: { id: "stop-id", position: 0, isFreeAdmission: null }
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
      is_free_admission: null,
    })
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
