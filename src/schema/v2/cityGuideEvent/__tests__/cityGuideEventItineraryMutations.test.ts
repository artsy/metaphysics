import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

// The attached itinerary in its `:short` shape (no `sections` key), as
// Gravity nests it inside a join row.
const gravityShortItinerary = {
  id: "itinerary-id",
  slug: "peckham-crawl",
  user_id: "editor-1",
  city_slug: "london-united-kingdom",
  title: "Peckham Crawl",
  subtitle: null,
  description: null,
  author_name: "Casey Lesser",
  is_curated: true,
  visibility: "private",
  published_at: null,
  published_by_id: null,
  share_token: null,
  sections_count: 0,
  image_url: null,
  image_urls: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
}

// Mirrors Gravity's city_guide_event_itinerary JSON: the join row, with the
// itinerary nested. The mutations only read `city_guide_event_id` off it.
const gravityJoin = (overrides = {}) => ({
  id: "join-id",
  city_guide_event_id: "event-id",
  itinerary_id: "itinerary-id",
  position: 0,
  itinerary: gravityShortItinerary,
  created_at: "2026-09-15T10:00:00Z",
  updated_at: "2026-09-15T10:00:00Z",
  ...overrides,
})

// What `cityGuideEventLoader` returns on the refetch: the event at `:all`,
// with `itineraries` as join rows.
const gravityCityGuideEvent = (overrides = {}) => ({
  id: "event-id",
  slug: "london-art-week",
  title: "London Art Week",
  subtitle: null,
  description: null,
  city_slug: "london-united-kingdom",
  start_at: "2026-10-05T00:00:00Z",
  end_at: "2026-10-12T00:00:00Z",
  time_zone: "Europe/London",
  published_at: null,
  published_by_id: null,
  image_url: null,
  image_urls: null,
  itineraries: [gravityJoin()],
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
  ...overrides,
})

const successFragment = gql`
  ... on CityGuideEventMutationSuccess {
    cityGuideEvent {
      internalID
      slug
      itineraries {
        internalID
        position
        itinerary {
          internalID
          title
        }
      }
    }
  }
`

const failureFragment = gql`
  ... on CityGuideEventMutationFailure {
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

const withLoaders = (
  loader: jest.Mock,
  refetch: jest.Mock = jest.fn().mockResolvedValue(gravityCityGuideEvent())
) => ({
  createCityGuideEventItineraryLoader: loader,
  updateCityGuideEventItineraryLoader: loader,
  deleteCityGuideEventItineraryLoader: loader,
  cityGuideEventLoader: refetch,
})

const paramError = new HTTPError("Bad Request", 400, {
  type: "param_error",
  message: "Itinerary must be a curated guide.",
  detail: { itinerary: ["must be a curated guide"] },
})

const forbiddenError = new HTTPError("Forbidden", 403, { error: "Forbidden" })

const joinNotFoundError = new HTTPError("Not Found", 404, {
  error: "City Guide Event Itinerary Not Found",
})

const eventNotFoundError = new HTTPError("Not Found", 404, {
  error: "City Guide Event Not Found",
})

describe("createCityGuideEventItinerary", () => {
  const mutation = gql`
    mutation {
      createCityGuideEventItinerary(
        input: {
          cityGuideEventID: "london-art-week"
          itineraryID: "peckham-crawl"
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
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const context = withLoaders(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith({
      city_guide_event_id: "london-art-week",
      itinerary_id: "peckham-crawl",
    })
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const context = withLoaders(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          createCityGuideEventItinerary(
            input: {
              cityGuideEventID: "london-art-week"
              itineraryID: "peckham-crawl"
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

  it("refetches the event by the id Gravity returns, not the slug sent", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoaders(loader, refetch)

    await runAuthenticatedQuery(mutation, context)

    expect(refetch).toHaveBeenCalledWith("event-id")
  })

  it("returns the refetched event as the success payload", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const context = withLoaders(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createCityGuideEventItinerary.responseOrError.cityGuideEvent
    ).toEqual({
      internalID: "event-id",
      slug: "london-art-week",
      itineraries: [
        {
          internalID: "join-id",
          position: 0,
          itinerary: { internalID: "itinerary-id", title: "Peckham Crawl" },
        },
      ],
    })
  })

  it("returns the failure member on a Gravity validation error, without refetching", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const refetch = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoaders(loader, refetch)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createCityGuideEventItinerary.responseOrError.mutationError
    ).toEqual({
      type: "param_error",
      message: "Itinerary must be a curated guide.",
      statusCode: 400,
      fieldErrors: [{ name: "itinerary", message: "must be a curated guide" }],
    })
    expect(refetch).not.toHaveBeenCalled()
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoaders(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("returns the failure member when the refetch fails with a Gravity error", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest.fn().mockRejectedValue(eventNotFoundError)
    const context = withLoaders(loader, refetch)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "City Guide Event Not Found", statusCode: 404 })
  })

  it("rethrows a non-Gravity refetch error", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest.fn().mockRejectedValue(new Error("boom"))
    const context = withLoaders(loader, refetch)

    await expect(runAuthenticatedQuery(mutation, context)).rejects.toThrow(
      "boom"
    )
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("updateCityGuideEventItinerary", () => {
  const mutation = gql`
    mutation {
      updateCityGuideEventItinerary(input: { id: "join-id", position: 0 }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the join id and position to Gravity, and nothing else", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const context = withLoaders(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateCityGuideEventItinerary(
            input: { id: "join-id", position: 0, clientMutationId: "abc" }
          ) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith("join-id", { position: 0 })
  })

  it("refetches the event by the id Gravity returns", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoaders(loader, refetch)

    await runAuthenticatedQuery(mutation, context)

    expect(refetch).toHaveBeenCalledWith("event-id")
  })

  it("returns the refetched event as the success payload", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const context = withLoaders(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateCityGuideEventItinerary.responseOrError.cityGuideEvent
    ).toMatchObject({
      internalID: "event-id",
      itineraries: [
        { internalID: "join-id", itinerary: { internalID: "itinerary-id" } },
      ],
    })
  })

  it("returns the failure member on a 404, without refetching", async () => {
    const loader = jest.fn().mockRejectedValue(joinNotFoundError)
    const refetch = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoaders(loader, refetch)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({
      message: "City Guide Event Itinerary Not Found",
      statusCode: 404,
    })
    expect(refetch).not.toHaveBeenCalled()
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoaders(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("returns the failure member when the refetch fails with a Gravity error", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest.fn().mockRejectedValue(eventNotFoundError)
    const context = withLoaders(loader, refetch)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "City Guide Event Not Found", statusCode: 404 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("deleteCityGuideEventItinerary", () => {
  const mutation = gql`
    mutation {
      deleteCityGuideEventItinerary(input: { id: "join-id" }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the join id to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const context = withLoaders(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("join-id", {})
  })

  it("refetches the event by the id Gravity returns", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoaders(loader, refetch)

    await runAuthenticatedQuery(mutation, context)

    expect(refetch).toHaveBeenCalledWith("event-id")
  })

  it("returns the refetched event, now without the detached itinerary", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest
      .fn()
      .mockResolvedValue(gravityCityGuideEvent({ itineraries: [] }))
    const context = withLoaders(loader, refetch)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteCityGuideEventItinerary.responseOrError.cityGuideEvent
    ).toEqual({
      internalID: "event-id",
      slug: "london-art-week",
      itineraries: [],
    })
  })

  it("returns the failure member on a 404, without refetching", async () => {
    const loader = jest.fn().mockRejectedValue(joinNotFoundError)
    const refetch = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoaders(loader, refetch)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({
      message: "City Guide Event Itinerary Not Found",
      statusCode: 404,
    })
    expect(refetch).not.toHaveBeenCalled()
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoaders(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("returns the failure member when the refetch fails with a Gravity error", async () => {
    const loader = jest.fn().mockResolvedValue(gravityJoin())
    const refetch = jest.fn().mockRejectedValue(eventNotFoundError)
    const context = withLoaders(loader, refetch)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteCityGuideEventItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "City Guide Event Not Found", statusCode: 404 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("schema exposure", () => {
  it("exposes every city guide event itinerary mutation on the schema", () => {
    const { schema } = require("schema/v2")
    const mutationFields = schema.getMutationType()!.getFields()

    ;[
      "createCityGuideEventItinerary",
      "updateCityGuideEventItinerary",
      "deleteCityGuideEventItinerary",
    ].forEach((name) => {
      expect(mutationFields[name]).toBeDefined()
    })
  })
})
