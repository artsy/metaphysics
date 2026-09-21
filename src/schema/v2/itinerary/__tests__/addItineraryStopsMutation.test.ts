import gql from "lib/gql"
import { runAuthenticatedQuery, runQuery } from "schema/v2/test/utils"
import { HTTPError } from "lib/HTTPError"

// Mirrors Gravity's itinerary_stop JSON, pointing at a `PartnerShow` so
// `item` has something to resolve.
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
  ... on AddItineraryStopsMutationSuccess {
    stops {
      internalID
      title
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
  ... on AddItineraryStopsMutationFailure {
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
  addItineraryStopsLoader: loader,
})

const paramError = new HTTPError("Unprocessable Entity", 422, {
  type: "param_error",
  message: "Longitude can't be blank.",
  detail: { longitude: ["can't be blank"] },
})

const forbiddenError = new HTTPError("Forbidden", 403, { error: "Forbidden" })

describe("addItineraryStops", () => {
  const mutation = gql`
    mutation {
      addItineraryStops(
        input: {
          itineraryID: "itinerary-id"
          stops: [
            { itemType: SHOW, itemID: "show-id", category: SHOW, isFreeAdmission: true }
            { title: "Cafe", timeZone: "America/New_York" }
          ]
        }
      ) {
        responseOrError {
          ${successFragment}
          ${failureFragment}
        }
      }
    }
  `

  it("exposes the mutation on the schema", () => {
    const { schema } = require("schema/v2")
    const mutationFields = schema.getMutationType()!.getFields()

    expect(mutationFields.addItineraryStops).toBeDefined()
  })

  it("passes the itinerary id and snake-cased stops to Gravity", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue([gravityStop(), gravityStop({ id: "stop-2" })])
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(mutation, context)

    expect(loader).toHaveBeenCalledWith("itinerary-id", {
      stops: [
        {
          item_type: "PartnerShow",
          item_id: "show-id",
          category: "SHOW",
          is_free_admission: true,
        },
        { title: "Cafe", time_zone: "America/New_York" },
      ],
    })
  })

  it("does not forward clientMutationId to Gravity", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue([gravityStop(), gravityStop({ id: "stop-2" })])
    const context = withShowsLoader(loader)

    await runAuthenticatedQuery(
      gql`
        mutation {
          addItineraryStops(
            input: {
              itineraryID: "itinerary-id"
              stops: [{ title: "Cafe" }]
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

    expect(loader.mock.calls[0][1]).not.toHaveProperty("client_mutation_id")
  })

  it("returns the success payload with the resolved items", async () => {
    const loader = jest
      .fn()
      .mockResolvedValue([gravityStop(), gravityStop({ id: "stop-2" })])
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.addItineraryStops.responseOrError.stops).toEqual([
      {
        internalID: "stop-id",
        title: null,
        item: { __typename: "Show", internalID: "show-id" },
      },
      {
        internalID: "stop-2",
        title: null,
        item: { __typename: "Show", internalID: "show-id" },
      },
    ])
  })

  it("still returns success when item enrichment fails", async () => {
    const loader = jest.fn().mockResolvedValue([gravityStop()])
    const context = {
      ...withShowsLoader(loader),
      showsLoader: jest.fn().mockRejectedValue(new Error("Gravity is down")),
    }

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.addItineraryStops.responseOrError.stops).toMatchObject([
      { internalID: "stop-id", item: null },
    ])
  })

  it("returns the failure member on a Gravity validation error (422)", async () => {
    const loader = jest.fn().mockRejectedValue(paramError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(result.addItineraryStops.responseOrError.mutationError).toEqual({
      type: "param_error",
      message: "Longitude can't be blank.",
      statusCode: 422,
      fieldErrors: [{ name: "longitude", message: "can't be blank" }],
    })
  })

  it("returns the failure member on a 403", async () => {
    const loader = jest.fn().mockRejectedValue(forbiddenError)
    const context = withShowsLoader(loader)

    const result = await runAuthenticatedQuery(mutation, context)

    expect(
      result.addItineraryStops.responseOrError.mutationError
    ).toMatchObject({ message: "Forbidden", statusCode: 403 })
  })

  it("throws when signed out", async () => {
    await expect(runQuery(mutation, {})).rejects.toThrow(
      "You need to be signed in"
    )
  })
})
