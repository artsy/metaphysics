import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

// Mirrors Gravity's `:all` itinerary JSON: sections with a stop pointing at
// a `PartnerShow`, so `sections { stops { item } }` has something to resolve.
const gravityItinerary = (overrides = {}) => ({
  id: "itinerary-id",
  slug: null,
  user_id: "user-42",
  city_slug: "new-york",
  title: "A day in Chelsea",
  subtitle: null,
  description: null,
  author_name: null,
  is_curated: false,
  visibility: "private",
  published_at: null,
  published_by_id: null,
  share_token: null,
  sections_count: 1,
  sections: [
    {
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
    },
  ],
  image_url: null,
  image_urls: null,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  ...overrides,
})

const gravityShortItinerary = (overrides = {}) => ({
  id: "itinerary-id",
  slug: null,
  user_id: "user-42",
  city_slug: "new-york",
  title: "A day in Chelsea",
  subtitle: null,
  description: null,
  author_name: null,
  is_curated: false,
  visibility: "private",
  published_at: null,
  published_by_id: null,
  share_token: null,
  sections_count: 0,
  created_at: "2026-08-01T09:00:00Z",
  updated_at: "2026-08-01T09:00:00Z",
  ...overrides,
})

const successFragment = gql`
  ... on ItineraryMutationSuccess {
    itinerary {
      internalID
      title
      sections {
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
  }
`

const failureFragment = gql`
  ... on ItineraryMutationFailure {
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
  createItineraryLoader: loader,
  updateItineraryLoader: loader,
  deleteItineraryLoader: loader,
  publishItineraryLoader: loader,
  unpublishItineraryLoader: loader,
  copyItineraryLoader: loader,
})

const paramError = new HTTPError("Bad Request", 400, {
  type: "param_error",
  message: "Title can't be blank.",
  detail: { title: ["can't be blank"] },
})

const forbiddenError = new HTTPError("Forbidden", 403, { error: "Forbidden" })

describe("createItinerary", () => {
  const mutation = gql`
    mutation {
      createItinerary(input: { citySlug: "new-york", title: "A day in Chelsea" }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith({
      city_slug: "new-york",
      title: "A day in Chelsea",
    })
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          createItinerary(
            input: {
              citySlug: "new-york"
              title: "A day in Chelsea"
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

  it("returns the success payload with the resolved stop item", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createItinerary.responseOrError.itinerary).toMatchObject({
      internalID: "itinerary-id",
      title: "A day in Chelsea",
      sections: [
        {
          stops: [{ item: { __typename: "Show", internalID: "show-id" } }],
        },
      ],
    })
  })

  it("still returns success when stop-item enrichment fails", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = {
      ...withShowsLoader(loader),
      showsLoader: jest.fn().mockRejectedValue(new Error("Gravity is down")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createItinerary.responseOrError.itinerary).toMatchObject({
      internalID: "itinerary-id",
      sections: [{ stops: [{ item: null }] }],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createItinerary.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Title can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "title", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.createItinerary.responseOrError.mutationError).toMatchObject({
      message: "Forbidden",
      statusCode: 403,
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("updateItinerary", () => {
  const mutation = gql`
    mutation {
      updateItinerary(input: { id: "itinerary-id", subtitle: null }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes an explicit null through to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("itinerary-id", { subtitle: null })
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateItinerary(
            input: { id: "itinerary-id", subtitle: null, clientMutationId: "abc" }
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
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          updateItinerary(input: { id: "itinerary-id", title: "New title" }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith("itinerary-id", { title: "New title" })
  })

  it("returns the success payload with the resolved stop item", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.updateItinerary.responseOrError.itinerary).toMatchObject({
      internalID: "itinerary-id",
      sections: [
        {
          stops: [{ item: { __typename: "Show", internalID: "show-id" } }],
        },
      ],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.updateItinerary.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Title can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "title", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.updateItinerary.responseOrError.mutationError).toMatchObject({
      message: "Forbidden",
      statusCode: 403,
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("deleteItinerary", () => {
  const mutation = gql`
    mutation {
      deleteItinerary(input: { id: "itinerary-id" }) {
        responseOrError {
          ... on ItineraryMutationSuccess {
            itinerary {
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
    const loader = jest.fn().mockResolvedValue(gravityShortItinerary())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("itinerary-id", {})
  })

  it("returns the success payload", async () => {
    const loader = jest.fn().mockResolvedValue(gravityShortItinerary())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.deleteItinerary.responseOrError.itinerary).toMatchObject({
      internalID: "itinerary-id",
      title: "A day in Chelsea",
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.deleteItinerary.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Title can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "title", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.deleteItinerary.responseOrError.mutationError).toMatchObject({
      message: "Forbidden",
      statusCode: 403,
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("publishItinerary", () => {
  const mutation = gql`
    mutation {
      publishItinerary(input: { id: "itinerary-id" }) {
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
      .mockResolvedValue(gravityItinerary({ visibility: "public" }))
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("itinerary-id", {})
  })

  it("returns the success payload with the resolved stop item", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(gravityItinerary({ visibility: "public" }))
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.publishItinerary.responseOrError.itinerary).toMatchObject({
      internalID: "itinerary-id",
      sections: [
        {
          stops: [{ item: { __typename: "Show", internalID: "show-id" } }],
        },
      ],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.publishItinerary.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Title can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "title", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.publishItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("unpublishItinerary", () => {
  const mutation = gql`
    mutation {
      unpublishItinerary(input: { id: "itinerary-id" }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the right args to Gravity", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("itinerary-id", {})
  })

  it("returns the success payload with the resolved stop item", async () => {
    const loader = jest.fn().mockResolvedValue(gravityItinerary())
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.unpublishItinerary.responseOrError.itinerary).toMatchObject({
      internalID: "itinerary-id",
      sections: [
        {
          stops: [{ item: { __typename: "Show", internalID: "show-id" } }],
        },
      ],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.unpublishItinerary.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Title can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "title", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.unpublishItinerary.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("copyItinerary", () => {
  const mutation = gql`
    mutation {
      copyItinerary(input: { id: "itinerary-id", shareToken: "abc123" }) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("passes the share token to Gravity", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(gravityItinerary({ id: "copy-id" }))
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("itinerary-id", {
      share_token: "abc123",
    })
  })

  it("sends no share token when the input omits one", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(gravityItinerary({ id: "copy-id" }))
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          copyItinerary(input: { id: "itinerary-id" }) {
            responseOrError {
              ${successFragment}
            }
          }
        }
      `,
      context
    )

    expect(loader).toHaveBeenCalledWith("itinerary-id", {})
  })

  it("returns the success payload with the resolved stop item", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue(gravityItinerary({ id: "copy-id" }))
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.copyItinerary.responseOrError.itinerary).toMatchObject({
      internalID: "copy-id",
      sections: [
        {
          stops: [{ item: { __typename: "Show", internalID: "show-id" } }],
        },
      ],
    })
  })

  it("returns the failure member on a Gravity validation error", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.copyItinerary.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Title can't be blank.",
      statusCode: 400,
      fieldErrors: [{ name: "title", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.copyItinerary.responseOrError.mutationError).toMatchObject({
      message: "Forbidden",
      statusCode: 403,
    })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})

describe("schema exposure", () => {
  it("exposes every itinerary mutation on the schema", () => {
    const { schema } = require("schema/v2")
    const mutationFields = schema.getMutationType()!.getFields()

    ;[
      "createItinerary",
      "updateItinerary",
      "deleteItinerary",
      "publishItinerary",
      "unpublishItinerary",
      "copyItinerary",
    ].forEach((name) => {
      expect(mutationFields[name]).toBeDefined()
    })
  })
})
