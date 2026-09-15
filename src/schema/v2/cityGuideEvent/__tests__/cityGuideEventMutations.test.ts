import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

// Mirrors Gravity's `:all` city_guide_event JSON. `itineraries` holds join
// rows, each with the attached itinerary nested in its `:short` shape (no
// `sections` key).
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
  itineraries: [
    {
      id: "join-id",
      city_guide_event_id: "event-id",
      itinerary_id: "itinerary-id",
      position: 0,
      itinerary: {
        id: "itinerary-id",
        slug: "peckham-crawl",
        user_id: "editor-1",
        city_slug: "london-united-kingdom",
        title: "Peckham Crawl",
        subtitle: null,
        description: null,
        author_name: "Casey Lesser",
        is_curated: true,
        visibility: "public",
        published_at: "2026-08-01T09:00:00Z",
        published_by_id: null,
        share_token: null,
        sections_count: 0,
        image_url: null,
        image_urls: null,
        created_at: "2026-08-01T09:00:00Z",
        updated_at: "2026-08-01T09:00:00Z",
      },
      created_at: "2026-09-15T10:00:00Z",
      updated_at: "2026-09-15T10:00:00Z",
    },
  ],
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
  ...overrides,
})

// Gravity's `:short` shape, returned by DELETE: no `itineraries` key at all.
const gravityShortCityGuideEvent = (overrides = {}) => ({
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
  created_at: "2026-09-01T09:00:00Z",
  updated_at: "2026-09-01T09:00:00Z",
  ...overrides,
})

const successFragment = gql`
  ... on CityGuideEventMutationSuccess {
    cityGuideEvent {
      internalID
      slug
      title
      subtitle
      citySlug
      publishedAt
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

const withLoader = (loader: jest.Mock) => ({
  createCityGuideEventLoader: loader,
  updateCityGuideEventLoader: loader,
  deleteCityGuideEventLoader: loader,
  publishCityGuideEventLoader: loader,
  unpublishCityGuideEventLoader: loader,
})

const paramError = new HTTPError("Bad Request", 400, {
  type: "param_error",
  message: "Start at must be before or equal to end_at.",
  detail: { start_at: ["must be before or equal to end_at"] },
})

const forbiddenError = new HTTPError("Forbidden", 403, { error: "Forbidden" })

const notFoundError = new HTTPError("Not Found", 404, {
  error: "City Guide Event Not Found",
})

describe("createCityGuideEvent", () => {
  const mutation = gql`
    mutation {
      createCityGuideEvent(
        input: {
          title: "London Art Week"
          citySlug: "london-united-kingdom"
          startAt: "2026-10-05T00:00:00Z"
          endAt: "2026-10-12T00:00:00Z"
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
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith({
      title: "London Art Week",
      city_slug: "london-united-kingdom",
      start_at: "2026-10-05T00:00:00Z",
      end_at: "2026-10-12T00:00:00Z",
    })
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          createCityGuideEvent(
            input: {
              title: "London Art Week"
              citySlug: "london-united-kingdom"
              startAt: "2026-10-05T00:00:00Z"
              endAt: "2026-10-12T00:00:00Z"
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

  it("forwards the optional fields snake-cased", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          createCityGuideEvent(
            input: {
              title: "London Art Week"
              citySlug: "london-united-kingdom"
              startAt: "2026-10-05T00:00:00Z"
              endAt: "2026-10-12T00:00:00Z"
              subtitle: "Openings across the city"
              description: "A week of gallery openings."
              timeZone: "Europe/London"
              imageURL: "https://s3.amazonaws.com/bucket/hero.jpg"
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
      title: "London Art Week",
      city_slug: "london-united-kingdom",
      start_at: "2026-10-05T00:00:00Z",
      end_at: "2026-10-12T00:00:00Z",
      subtitle: "Openings across the city",
      description: "A week of gallery openings.",
      time_zone: "Europe/London",
      image_url: "https://s3.amazonaws.com/bucket/hero.jpg",
    })
  })

  it("returns the success payload with the attached itineraries as join rows", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createCityGuideEvent.responseOrError.cityGuideEvent).toEqual({
      internalID: "event-id",
      slug: "london-art-week",
      title: "London Art Week",
      subtitle: null,
      citySlug: "london-united-kingdom",
      publishedAt: null,
      itineraries: [
        {
          internalID: "join-id",
          position: 0,
          itinerary: { internalID: "itinerary-id", title: "Peckham Crawl" },
        },
      ],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createCityGuideEvent.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Start at must be before or equal to end_at.",
      statusCode: 400,
      fieldErrors: [
        { name: "start_at", message: "must be before or equal to end_at" },
      ],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.createCityGuideEvent.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("updateCityGuideEvent", () => {
  const mutation = gql`
    mutation {
      updateCityGuideEvent(input: { id: "event-id", subtitle: null }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes an explicit null through to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("event-id", { subtitle: null })
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateCityGuideEvent(
            input: { id: "event-id", subtitle: null, clientMutationId: "abc" }
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

  it("omits fields the client did not send", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateCityGuideEvent(input: { id: "event-id", title: "New title" }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith("event-id", { title: "New title" })
  })

  it("forwards the date and time zone fields snake-cased", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateCityGuideEvent(
            input: {
              id: "event-id"
              citySlug: "paris-france"
              startAt: "2026-11-01T00:00:00Z"
              endAt: "2026-11-08T00:00:00Z"
              timeZone: "Europe/Paris"
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

    expect(loader).toHaveBeenCalledWith("event-id", {
      city_slug: "paris-france",
      start_at: "2026-11-01T00:00:00Z",
      end_at: "2026-11-08T00:00:00Z",
      time_zone: "Europe/Paris",
    })
  })

  it("forwards imageURL to Gravity as image_url", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateCityGuideEvent(
            input: {
              id: "event-id"
              imageURL: "https://s3.amazonaws.com/bucket/hero.jpg"
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

    expect(loader).toHaveBeenCalledWith("event-id", {
      image_url: "https://s3.amazonaws.com/bucket/hero.jpg",
    })
  })

  it("passes an explicit null imageURL through to Gravity, to clear it", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateCityGuideEvent(input: { id: "event-id", imageURL: null }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith("event-id", { image_url: null })
  })

  it("returns the success payload", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateCityGuideEvent.responseOrError.cityGuideEvent
    ).toMatchObject({
      internalID: "event-id",
      title: "London Art Week",
      itineraries: [
        {
          internalID: "join-id",
          position: 0,
          itinerary: { internalID: "itinerary-id", title: "Peckham Crawl" },
        },
      ],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.updateCityGuideEvent.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Start at must be before or equal to end_at.",
      statusCode: 400,
      fieldErrors: [
        { name: "start_at", message: "must be before or equal to end_at" },
      ],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.updateCityGuideEvent.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("deleteCityGuideEvent", () => {
  const mutation = gql`
    mutation {
      deleteCityGuideEvent(input: { id: "event-id" }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityShortCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("event-id", {})
  })

  it("returns the success payload, with no itineraries on the short shape", async () => {
    const loader = jest.fn().mockResolvedValue(gravityShortCityGuideEvent())
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteCityGuideEvent.responseOrError.cityGuideEvent
    ).toMatchObject({
      internalID: "event-id",
      title: "London Art Week",
      itineraries: [],
    })
  })

  it("returns the failure member on a 404", async () => {
    const loader = jest.fn().mockRejectedValue(notFoundError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteCityGuideEvent.responseOrError.mutationError
    ).toMatchObject({ message: "City Guide Event Not Found", statusCode: 404 })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.deleteCityGuideEvent.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("publishCityGuideEvent", () => {
  const mutation = gql`
    mutation {
      publishCityGuideEvent(input: { id: "event-id" }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(
        gravityCityGuideEvent({ published_at: "2026-09-15T10:00:00Z" })
      )
    const context = withLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("event-id", {})
  })

  it("returns the now-published event", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(
        gravityCityGuideEvent({ published_at: "2026-09-15T10:00:00Z" })
      )
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.publishCityGuideEvent.responseOrError.cityGuideEvent
    ).toMatchObject({
      internalID: "event-id",
      publishedAt: "2026-09-15T10:00:00Z",
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.publishCityGuideEvent.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("returns the failure member on a 404", async () => {
    const loader = jest.fn().mockRejectedValue(notFoundError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.publishCityGuideEvent.responseOrError.mutationError
    ).toMatchObject({ message: "City Guide Event Not Found", statusCode: 404 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("unpublishCityGuideEvent", () => {
  const mutation = gql`
    mutation {
      unpublishCityGuideEvent(input: { id: "event-id" }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("event-id", {})
  })

  it("returns the now-unpublished event", async () => {
    const loader = jest.fn().mockResolvedValue(gravityCityGuideEvent())
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.unpublishCityGuideEvent.responseOrError.cityGuideEvent
    ).toMatchObject({ internalID: "event-id", publishedAt: null })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.unpublishCityGuideEvent.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("schema exposure", () => {
  it("exposes every city guide event mutation on the schema", () => {
    const { schema } = require("schema/v2")
    const mutationFields = schema.getMutationType()!.getFields()

    ;[
      "createCityGuideEvent",
      "updateCityGuideEvent",
      "deleteCityGuideEvent",
      "publishCityGuideEvent",
      "unpublishCityGuideEvent",
    ].forEach((name) => {
      expect(mutationFields[name]).toBeDefined()
    })
  })
})
