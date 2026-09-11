import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

// Mirrors Gravity's `:all` itinerary_section JSON: a stop pointing at a
// `PartnerShow`, so `stops { item }` has something to resolve.
const gravitySection = (overrides = {}) => ({
  id: "section-id",
  itinerary_id: "itinerary-id",
  title: "Morning",
  note: null,
  position: 0,
  stops_count: 1,
  stops: [
    {
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
      time_zone: null,
      note: null,
      category: null,
      is_free_admission: null,
      source_url: null,
      created_at: "2026-08-01T09:00:00Z",
      updated_at: "2026-08-01T09:00:00Z",
    },
  ],
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  ...overrides,
})

const gravityShortSection = (overrides = {}) => ({
  id: "section-id",
  itinerary_id: "itinerary-id",
  title: "Morning",
  note: null,
  position: 0,
  stops_count: 0,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  ...overrides,
})

const successFragment = gql`
  ... on ItinerarySectionMutationSuccess {
    itinerarySection {
      internalID
      title
      note
      stops {
        item {
          __typename
          ... on Show {
            internalID
          }
        }
      }
    }
  }
`

const failureFragment = gql`
  ... on ItinerarySectionMutationFailure {
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
  createItinerarySectionLoader: loader,
  updateItinerarySectionLoader: loader,
  deleteItinerarySectionLoader: loader,
})

const paramError = new HTTPError("Bad Request", 400, {
  type: "param_error",
  message: "Title can't be blank.",
  detail: { title: ["can't be blank"] },
})

const forbiddenError = new HTTPError("Forbidden", 403, { error: "Forbidden" })

describe("createItinerarySection", () => {
  const mutation = gql`
    mutation {
      createItinerarySection(
        input: { itineraryID: "itinerary-id", title: "Morning" }
      ) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravitySection())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith({
      itinerary_id: "itinerary-id",
      title: "Morning",
    })
  })

  it("returns the success payload with the resolved stop item", async () => {
    const loader = jest.fn().mockResolvedValue(gravitySection())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createItinerarySection.responseOrError.itinerarySection
    ).toMatchObject({
      internalID: "section-id",
      title: "Morning",
      note: null,
      stops: [{ item: { __typename: "Show", internalID: "show-id" } }],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createItinerarySection.responseOrError.mutationError).toEqual(
      {
        type: "param_error",
        message: "Title can't be blank.",
        statusCode: 400,
        fieldErrors: [{ name: "title", message: "can't be blank" }],
      }
    )
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createItinerarySection.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("updateItinerarySection", () => {
  const mutation = gql`
    mutation {
      updateItinerarySection(
        input: { id: "section-id", position: 0, note: null }
      ) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravitySection())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("section-id", {
      position: 0,
      note: null,
    })
  })

  it("returns the success payload with the resolved stop item", async () => {
    const loader = jest.fn().mockResolvedValue(gravitySection())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateItinerarySection.responseOrError.itinerarySection
    ).toMatchObject({
      internalID: "section-id",
      title: "Morning",
      stops: [{ item: { __typename: "Show", internalID: "show-id" } }],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.updateItinerarySection.responseOrError.mutationError).toEqual(
      {
        type: "param_error",
        message: "Title can't be blank.",
        statusCode: 400,
        fieldErrors: [{ name: "title", message: "can't be blank" }],
      }
    )
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateItinerarySection.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("deleteItinerarySection", () => {
  const mutation = gql`
    mutation {
      deleteItinerarySection(input: { id: "section-id" }) {
        responseOrError {
          ... on ItinerarySectionMutationSuccess {
            itinerarySection {
              internalID
              title
            }
          }
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityShortSection())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("section-id", {})
  })

  it("returns the success payload", async () => {
    const loader = jest.fn().mockResolvedValue(gravityShortSection())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteItinerarySection.responseOrError.itinerarySection
    ).toMatchObject({
      internalID: "section-id",
      title: "Morning",
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.deleteItinerarySection.responseOrError.mutationError).toEqual(
      {
        type: "param_error",
        message: "Title can't be blank.",
        statusCode: 400,
        fieldErrors: [{ name: "title", message: "can't be blank" }],
      }
    )
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteItinerarySection.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("schema exposure", () => {
  it("exposes every itinerary section mutation on the schema", () => {
    const { schema } = require("schema/v2")
    const mutationFields = schema.getMutationType()!.getFields()

    ;[
      "createItinerarySection",
      "updateItinerarySection",
      "deleteItinerarySection",
    ].forEach((name) => {
      expect(mutationFields[name]).toBeDefined()
    })
  })
})
